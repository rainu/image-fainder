<template>
	<div>
		<ProcessorLoader modelName="Xenova/clip-vit-base-patch32" />
		<ClipVisionModelLoader modelName="jinaai/jina-clip-v1" />

		<template v-if="directory">
			<v-btn v-if="!progress.doing" @click="onClick" :disabled="!isLoaded" color="primary" block>
				<v-icon icon="mdi-file-eye"></v-icon>
				Analyse Images
			</v-btn>
			<ProgressDialog v-else :title="progress.title" :current="progress.current" :total="progress.total" unit="image" />
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { RawImage } from '@huggingface/transformers'
import ProcessorLoader from './ProcessorLoader.vue'
import ClipVisionModelLoader from './ClipVisionModelLoader.vue'
import { useAiStore } from '../../store/ai.ts'
import ProgressDialog from '../progress/Dialog.vue'
import { delayProgress } from '../progress/delayed.ts'
import { VectorEntry, VectorEntryKey } from '../../database/vector.ts'

const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff']

export default defineComponent({
	name: 'VisionEmbedding',
	components: { ProgressDialog, ClipVisionModelLoader, ProcessorLoader },
	props: {
		directory: {
			type: Object as () => FileSystemDirectoryHandle,
			required: false,
		},
	},
	data() {
		return {
			progress: {
				title: '',
				total: null as Number | null,
				current: null as Number | null,
				doing: false,
			},
		}
	},
	computed: {
		...mapState(useAiStore, ['processor', 'visionModel']),
		isLoaded() {
			return this.processor && this.visionModel
		},
	},
	methods: {
		async listFiles(root: string, dir: FileSystemDirectoryHandle): Promise<string[]> {
			const matches = []

			for await (const entry of dir.values()) {
				if (entry.kind === 'directory') {
					const subMatches = await this.listFiles(root + '/' + entry.name, entry)
					matches.push(...subMatches)
				} else if (entry.kind === 'file' && validImageExtensions.some((ext) => entry.name.endsWith(ext))) {
					matches.push(root + '/' + entry.name)
				}
			}

			return matches
		},
		async scanImageFiles(fileNames: string[]): Promise<FileSystemFileHandle[]> {
			if(fileNames.length === 0) {
				return []
			}

			const files = []

			this.progress.title = 'Step 1/4: Scanning files'
			this.progress.total = fileNames.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (const fileName of fileNames) {
				try {
					const file = await this.directory.getFileHandle(
						// remove directory name from file name
						fileName.substring(this.directory.name.length + 1),
					)
					const exists = await this.$vectorDB.exists(fileName)

					if (!exists) {
						files.push(file)
					}
				} catch (e) {
					console.error(e)
				}

				delayedProgression.add(1)
			}

			return files
		},
		async analyseImages(files: FileSystemFileHandle[]) {
			if(files.length === 0) {
				return
			}

			this.progress.title = 'Step 2/4: Process unknown images'
			this.progress.total = files.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (let file of files) {
				const fileBlob = await file.getFile()
				const image = await RawImage.fromBlob(fileBlob)

				const imageInputs = await this.processor(image)
				const result = await this.visionModel(imageInputs)

				await this.$vectorDB.save({
					directory: this.directory.name,
					path: `${this.directory.name}/${file.name}`,
					embedding: Array.from(result.image_embeds[0].data),
				})

				delayedProgression.add(1)
			}
		},
		async getOrphanedImages(fileNames: string[]): Promise<VectorEntryKey[]> {
			const count = await this.$vectorDB.count(this.directory.name)
			if(count === 0) {
				return []
			}

			this.progress.title = 'Step 3/4: Detect orphaned images'
			this.progress.total = count
			this.progress.current = 0

			let fileNameMap = {}
			for (const fileName of fileNames) {
				fileNameMap[fileName] = true
			}

			const result = [] as VectorEntryKey[]
			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			await this.$vectorDB.iterate(this.directory.name, (entry: VectorEntry) => {
				if (!fileNameMap[entry.path]) {
					result.push(entry.id)
				}
				delayedProgression.add(1)

				return true
			})

			return result
		},
		async deleteOrphaned(keys: VectorEntryKey[]): Promise<void> {
			if(keys.length === 0) {
				return
			}

			this.progress.title = 'Step 4/4: Delete orphaned images'
			this.progress.total = keys.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (let key of keys) {
				await this.$vectorDB.delete(key)

				delayedProgression.add(1)
			}
		},
		async process() {
			const fileNames = await this.listFiles(this.directory.name, this.directory)
			const files = await this.scanImageFiles(fileNames)
			await this.analyseImages(files)

			const orphaned = await this.getOrphanedImages(fileNames)
			await this.deleteOrphaned(orphaned)
		},
		async onClick() {
			this.progress.doing = true
			try {
				await this.process()
			} catch (e) {
				console.error(e)
			}
			this.progress.doing = false
			this.progress.total = 0
		},
	},
})
</script>

<style scoped></style>
