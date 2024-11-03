<template>
	<div>
		<ProcessorLoader modelName="Xenova/clip-vit-base-patch32" />
		<ClipVisionModelLoader modelName="jinaai/jina-clip-v1" />

		<template v-if="directory">
			<v-btn v-if="!progress.doing" @click="onDirectory" :disabled="!isLoaded" color="primary" block>
				<v-icon icon="mdi-file-eye"></v-icon>
				{{ $t('vision.analyse.action') }}
			</v-btn>
		</template>
		<template v-if="collection">
			<v-btn v-if="!progress.doing" @click="onCollection" color="primary" block>
				<v-icon icon="mdi-file-eye"></v-icon>
				{{ $t('vision.analyse.action') }}
			</v-btn>
		</template>

		<ProgressDialog
			v-if="progress.doing"
			:title="progress.title"
			:current="progress.current"
			:total="progress.total"
			:unit="$t('progress.duration.unit.image')"
			@interrupt="onInterrupt"
		/>
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
import { PersistedVectorEntry, VectorEntryKey } from '../../database/vector.ts'
import { localFileURI, parseURI } from '../../database/uri.ts'

const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff']

export default defineComponent({
	name: 'VisionEmbedding',
	components: { ProgressDialog, ClipVisionModelLoader, ProcessorLoader },
	props: {
		directory: {
			type: Object as () => FileSystemDirectoryHandle | null,
			default: null,
		},
		collection: {
			type: String,
			default: null,
		},
	},
	data() {
		return {
			progress: {
				title: '',
				total: 0,
				current: 0,
				doing: false,
				interrupted: false,
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
		onInterrupt() {
			this.progress.interrupted = true
		},
		async listFiles(root: string, dir: FileSystemDirectoryHandle): Promise<string[]> {
			const matches = []

			for await (const entry of dir.values()) {
				if (this.progress.interrupted) {
					break
				}

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
			if (fileNames.length === 0 || !this.directory) {
				return []
			}

			const files = []

			this.progress.title = this.$t('vision.analyse.step.1')
			this.progress.total = fileNames.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (const fileName of fileNames) {
				if (this.progress.interrupted) {
					break
				}

				try {
					const file = await this.directory.getFileHandle(
						// remove directory name from file name
						fileName.substring(this.directory.name.length + 1),
					)
					const fileUri = localFileURI(this.directory.name, file.name)
					const exists = await this.$vectorDB.exists(fileUri)

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
		async analyseImageFiles(files: FileSystemFileHandle[]) {
			if (files.length === 0 || !this.processor || !this.visionModel || !this.directory) {
				return
			}

			this.progress.title = this.$t('vision.analyse.step.2')
			this.progress.total = files.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (let file of files) {
				if (this.progress.interrupted) {
					break
				}

				const fileBlob = await file.getFile()
				const image = await RawImage.fromBlob(fileBlob)

				const imageInputs = await this.processor(image)
				const result = await this.visionModel(imageInputs)

				await this.$vectorDB.saveLocal({
					collection: this.directory.name,
					uri: localFileURI(this.directory.name, file.name),
					embedding: result.image_embeds[0].data,
				})

				delayedProgression.add(1)
			}
		},
		async analyseImageUrls(entries: PersistedVectorEntry[]) {
			if (entries.length === 0 || !this.processor || !this.visionModel) {
				return
			}

			this.progress.title = this.$t('vision.analyse.step.2')
			this.progress.total = entries.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (let entry of entries) {
				if (this.progress.interrupted) {
					break
				}

				const uri = parseURI(entry.uri)
				if (!uri) {
					continue
				}

				const image = await RawImage.fromURL(uri.rawURI)

				const imageInputs = await this.processor(image)
				const result = await this.visionModel(imageInputs)

				entry.embedding = result.image_embeds[0].data
				await this.$vectorDB.saveRemote(entry)

				delayedProgression.add(1)
			}
		},
		async getOrphanedImages(fileNames: string[]): Promise<VectorEntryKey[]> {
			if (!this.directory || this.progress.interrupted) {
				return []
			}

			const count = await this.$vectorDB.countLocal(this.directory.name)
			if (count === 0) {
				return []
			}

			this.progress.title = this.$t('vision.analyse.step.3')
			this.progress.total = count
			this.progress.current = 0

			let fileNameMap = {} as Record<string, boolean>
			for (const fileName of fileNames) {
				fileNameMap[fileName] = true
			}

			const result = [] as VectorEntryKey[]
			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			await this.$vectorDB.iterateLocal(this.directory.name, (entry) => {
				const parsedURI = parseURI(entry.uri)
				if (parsedURI === null || parsedURI.type !== 'localFile') {
					//skip non-local files
					return true
				}

				const fileName = parsedURI.directory + '/' + parsedURI.name
				if (!fileNameMap[fileName]) {
					result.push(entry.id)
				}
				delayedProgression.add(1)

				return !this.progress.interrupted
			})

			return result
		},
		async deleteOrphaned(keys: VectorEntryKey[]): Promise<void> {
			if (keys.length === 0) {
				return
			}

			this.progress.title = this.$t('vision.analyse.step.4')
			this.progress.total = keys.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (let key of keys) {
				if (this.progress.interrupted) {
					break
				}
				await this.$vectorDB.delete(key)

				delayedProgression.add(1)
			}
		},
		async processLocalDirectory() {
			if (!this.directory) {
				return
			}

			const fileNames = await this.listFiles(this.directory.name, this.directory)
			const files = await this.scanImageFiles(fileNames)
			await this.analyseImageFiles(files)

			const orphaned = await this.getOrphanedImages(fileNames)
			await this.deleteOrphaned(orphaned)
		},
		async processCollection() {
			if (!this.collection) {
				return
			}

			const entries = [] as PersistedVectorEntry[]
			await this.$vectorDB.iterateRemote(this.collection, (entry: PersistedVectorEntry) => {
				if (entry.embedding.length === 0) {
					entries.push(entry)
				}
				return !this.progress.interrupted
			})
			await this.analyseImageUrls(entries)
		},
		async process(type: 'directory' | 'collection') {
			this.progress.doing = true
			try {
				if (type === 'directory') {
					await this.processLocalDirectory()
				} else if (type === 'collection') {
					await this.processCollection()
				}
			} catch (e) {
				console.error(e)
			}
			this.progress.doing = false
			this.progress.total = 0
			this.progress.interrupted = false
		},
		async onDirectory() {
			await this.process('directory')
		},
		async onCollection() {
			await this.process('collection')
		},
	},
})
</script>

<style scoped></style>
