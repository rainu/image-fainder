<template>
	<LinedTextarea
		v-model="newItems"
		:annotations="newItems ? itemAnnotations.all : undefined"
		:styles="{ height: '50vh' }"
	></LinedTextarea>

	<v-expansion-panels v-model="itemAnnotations.panel" >
		<v-expansion-panel value="annotation" v-show="Object.keys(itemAnnotations.all).length > 0">
			<v-expansion-panel-title>
				{{
					$t('collection.manage.validation.summary', {
						success: successCount,
						errors: errorCount,
						warnings: warningCount,
					})
				}}
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<v-list>
					<v-list-item v-for="(value, key) in itemAnnotationsView" :key="key">
						<v-alert :type="value.class || undefined" variant="tonal" density="compact">
							<v-alert-title>{{ value.text }}</v-alert-title>
							<span class="progress-alert-line-content"> {{ Number(key) + 1 }}: {{ value.line }} </span>
						</v-alert>
					</v-list-item>
				</v-list>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>

	<ProgressDialog
		:title="$t('collection.manage.add.lines')"
		:current="progress.text.current"
		:total="progress.text.total"
		@interrupt="onInterrupt"
	/>
	<ProgressDialog
		:title="$t('collection.manage.add.file')"
		:current="progress.file.current"
		:total="progress.file.total"
		hide-steps
		@interrupt="onInterrupt"
	>
		<template v-slot:progressbar>
			<span>{{ progress.file.currentLine }}</span>
		</template>
	</ProgressDialog>

	<v-app-bar location="bottom" elevation="0" density="compact">
		<v-container>
			<v-row>
				<v-col cols="6">
					<v-btn color="primary" variant="elevated" block @click="onAddFileItems">
						<v-icon icon="mdi-image-plus"></v-icon>
						<v-icon icon="mdi-file"></v-icon>
						{{ $t('collection.manage.add.file') }}
					</v-btn>
				</v-col>
				<v-col cols="6">
					<v-btn color="primary" variant="elevated" block :disabled="!newItems" @click="onAddItems">
						<v-icon icon="mdi-image-plus"></v-icon>
						{{ $t('collection.manage.add.lines') }}
					</v-btn>
				</v-col>
			</v-row>
		</v-container>
	</v-app-bar>

	<v-app-bar v-show="itemAnnotations.panel === 'annotation'" location="bottom" elevation="0" density="compact">
		<v-container>
			<v-pagination v-model="itemAnnotations.page" :length="itemAnnotationsPageCount"></v-pagination>
		</v-container>
	</v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LinedTextarea, { Annotation } from '../../../components/LinedTextarea.vue'
import { remoteFileURI } from '../../../database/uri.ts'
import ProgressDialog from '../../../components/progress/Dialog.vue'
import { delayProgress } from '../../../components/progress/delayed.ts'

type AdvancedAnnotation = Annotation & { line: string; class: 'error' | 'success' | 'warning' }

export default defineComponent({
	components: { ProgressDialog, LinedTextarea },
	data() {
		return {
			newItems: null as string | null,
			itemAnnotations: {
				panel: '',
				all: {} as Record<number, AdvancedAnnotation>,
				page: 1,
				limit: 100,
			},
			progress: {
				interrupted: false,
				text: {
					current: 0,
					total: 0,
				},
				file: {
					current: 0,
					currentLine: 0,
					total: 0,
				},
			},
		}
	},
	computed: {
		collectionName(): string {
			if (Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		},
		successCount() {
			return Object.values(this.itemAnnotations.all).filter((a) => a.class === 'success').length
		},
		warningCount() {
			return Object.values(this.itemAnnotations.all).filter((a) => a.class === 'warning').length
		},
		errorCount() {
			return Object.values(this.itemAnnotations.all).filter((a) => a.class === 'error').length
		},
		itemAnnotationsView() {
			const start = (this.itemAnnotations.page - 1) * this.itemAnnotations.limit
			const end = start + this.itemAnnotations.limit
			return Object.entries(this.itemAnnotations.all)
				.sort(([a], [b]) => Number(a) - Number(b))
				.slice(start, end)
				.reduce((acc, [key, value]) => {
					acc[Number(key)] = value
					return acc
				}, {} as Record<number, AdvancedAnnotation>)
		},
		itemAnnotationsPageCount() {
			return Math.ceil(Object.keys(this.itemAnnotations.all).length / this.itemAnnotations.limit)
		},
	},
	methods: {
		onInterrupt() {
			this.progress.interrupted = true
		},
		async processLine(line: string): Promise<AdvancedAnnotation> {
			const valid = URL.canParse(line)
			if (!valid) {
				return {
					line,
					text: this.$t('collection.manage.validation.invalid.url'),
					class: 'error',
				}
			}

			try {
				const uri = remoteFileURI(this.collectionName, line)
				const exists = await this.$vectorDB.exists(uri)

				if (exists) {
					return {
						line,
						text: this.$t('collection.manage.validation.invalid.exists'),
						class: 'warning',
					}
				} else {
					await this.$vectorDB.saveRemote({
						collection: this.collectionName,
						uri: uri,
						embedding: Float32Array.from([]),
					})

					return {
						line,
						class: 'success',
					}
				}
			} catch (e: unknown) {
				const error = e as Error
				return {
					line,
					text: this.$t('collection.manage.validation.invalid.error', { error: error.message }),
					class: 'error',
				}
			}
		},
		async onAddItems() {
			if (!this.newItems) {
				return
			}
			const results = {} as Record<number, AdvancedAnnotation>
			this.progress.text.current = 0
			this.progress.interrupted = false

			const lines = this.newItems.split('\n')
			this.progress.text.total = lines.length

			const delayedProgression = delayProgress((i) => (this.progress.text.current = i))
			for (let i = 0; i < lines.length; i++) {
				if (this.progress.interrupted) {
					break
				}

				results[i] = await this.processLine(lines[i])
				delayedProgression.add(1)
			}

			this.progress.text.total = 0
			this.itemAnnotations.all = results
		},
		async onAddFileItems() {
			const [fileHandle] = await window.showOpenFilePicker()
			const file = await fileHandle.getFile()

			const results = {} as Record<number, AdvancedAnnotation>
			this.progress.file.total = file.size
			this.progress.file.current = 0
			this.progress.interrupted = false

			const delayedProgression = delayProgress((i) => (this.progress.file.current = i))
			const delayedProgressionLine = delayProgress((i) => (this.progress.file.currentLine = i))

			const stream = file.stream()
			const reader = stream.getReader()
			const decoder = new TextDecoder('utf-8')
			let read = await reader.read()
			let buffer = ''

			let line = 0
			while (!read.done) {
				if (this.progress.interrupted) {
					break
				}

				buffer += decoder.decode(read.value, { stream: true })

				let lines = buffer.split('\n')
				buffer = lines.pop() || ''

				for (let i = 0; i < lines.length; i++) {
					if (this.progress.interrupted) {
						break
					}
					results[line] = await this.processLine(lines[i])

					delayedProgression.add(lines[i].length)
					delayedProgressionLine.add(1)

					line++
				}

				read = await reader.read()
			}

			if (buffer.length > 0) {
				if (!this.progress.interrupted) {
					results[line] = await this.processLine(buffer)
				}
			}

			this.progress.file.total = 0
			this.itemAnnotations.all = results
		},
	},
})
</script>

<style>
a {
	text-decoration: none;
	color: inherit;
}

.lined-textarea .error {
	background-color: red;
	color: white;
}

.lined-textarea .warning {
	background-color: yellow;
	color: black;
}

.lined-textarea .success {
	background-color: greenyellow;
	color: black;
}

.progress-alert-line-content {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	word-break: break-all;
}
</style>
