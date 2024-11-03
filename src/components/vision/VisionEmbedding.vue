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

type DirectoryContent = {
	directory: FileSystemDirectoryHandle
	files: string[]
	subDirectories: DirectoryContent[]
}
type FileWithParent = {
	file: FileSystemFileHandle
	parent: string
}

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
		async listFiles(root: string, dir: FileSystemDirectoryHandle): Promise<DirectoryContent> {
			const result = {
				directory: dir,
				files: [],
				subDirectories: [],
			} as DirectoryContent

			for await (const entry of dir.values()) {
				if (this.progress.interrupted) {
					break
				}

				if (entry.kind === 'directory') {
					const subDirectory = await this.listFiles(root + '/' + entry.name, entry)
					result.subDirectories.push(subDirectory)
				} else if (entry.kind === 'file' && validImageExtensions.some((ext) => entry.name.endsWith(ext))) {
					result.files.push(entry.name)
				}
			}

			return result
		},
		async walkDirectory(
			path: string,
			directory: DirectoryContent,
			callback: (path: string, handle: FileSystemDirectoryHandle, filename: string) => Promise<boolean>,
		) {
			for (let file of directory.files) {
				const shouldContinue = await callback(path, directory.directory, file)
				if (!shouldContinue) {
					return
				}
			}

			for (let subDirectory of directory.subDirectories) {
				await this.walkDirectory(path + '/' + subDirectory.directory.name, subDirectory, callback)
			}
		},
		async scanImageFiles(dirContent: DirectoryContent): Promise<FileWithParent[]> {
			const files = [] as FileWithParent[]

			this.progress.title = this.$t('vision.analyse.step.1')

			let totalFiles = 0
			await this.walkDirectory('', dirContent, async () => {
				totalFiles++
				return true
			})
			this.progress.total = totalFiles
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			await this.walkDirectory(dirContent.directory.name, dirContent, async (path, dirHandle, filename) => {
				try {
					const file = await dirHandle.getFileHandle(filename)
					const fileUri = localFileURI(path, file.name)
					const exists = await this.$vectorDB.exists(fileUri)

					if (!exists) {
						files.push({
							file: file,
							parent: path,
						})
					}
				} catch (e) {
					console.error(e)
				}

				delayedProgression.add(1)

				return !this.progress.interrupted
			})

			return files
		},
		async analyseImageFiles(files: FileWithParent[]) {
			if (files.length === 0 || !this.processor || !this.visionModel || !this.directory) {
				return
			}

			this.progress.title = this.$t('vision.analyse.step.2')
			this.progress.total = files.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			for (let fileWithParent of files) {
				if (this.progress.interrupted) {
					break
				}

				const fileBlob = await fileWithParent.file.getFile()
				const image = await RawImage.fromBlob(fileBlob)

				const imageInputs = await this.processor(image)
				const result = await this.visionModel(imageInputs)

				const uri = localFileURI(fileWithParent.parent, fileWithParent.file.name)
				await this.$vectorDB.saveLocal({
					collection: this.directory.name,
					uri,
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
		async getOrphanedImages(dirContent: DirectoryContent): Promise<VectorEntryKey[]> {
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
			await this.walkDirectory(dirContent.directory.name, dirContent, async (path, _, filename) => {
				fileNameMap[path + '/' + filename] = true
				return !this.progress.interrupted
			})

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

			const dirContent = await this.listFiles(this.directory.name, this.directory)
			const files = await this.scanImageFiles(dirContent)
			await this.analyseImageFiles(files)

			const orphaned = await this.getOrphanedImages(dirContent)
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
