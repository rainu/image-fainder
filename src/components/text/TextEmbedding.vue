<template>
	<v-container>
		<v-text-field
			v-model="searchTerm"
			@click:append-inner="onSearch"
			@keydown.enter.prevent="onSearch"
			:disabled="progress.total > 0"
			:label="$t('search.label')"
			variant="solo"
			single-line
			hide-details
			density="compact"
			append-inner-icon="mdi-magnify"
		>
		</v-text-field>
		<ProgressDialog
			:title="$t('search.progress.title')"
			:current="progress.current"
			:total="progress.total"
			@interrupt="onInterrupt"
		/>
	</v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { cos_sim } from '@huggingface/transformers'
import { useAiStore } from '../../store/ai'
import { VectorEntry } from '../../database/vector'
import AutoTokenizerLoader from './AutoTokenizerLoader.vue'
import ClipTextModelLoader from './ClipTextModelLoader.vue'
import ProgressBar from '../progress/Bar.vue'
import ProgressDialog from '../progress/Dialog.vue'
import { useSettingsStore } from '../../store/settings.ts'
import { delayProgress } from '../progress/delayed.ts'
import { ParsedURI, parseURI } from '../../database/uri.ts'

export interface ImageResult {
	uri: ParsedURI
	similarity: number
}

export default defineComponent({
	name: 'TextEmbedding',
	components: { ProgressDialog, ProgressBar, ClipTextModelLoader, AutoTokenizerLoader },
	props: {
		directory: {
			type: String,
			default: null,
		},
		collection: {
			type: String,
			default: null,
		},
		similarityThreshold: {
			type: Number,
			default: null,
		},
	},
	emits: ['searchResult'],
	data() {
		return {
			searchTerm: '',
			progress: {
				total: 0,
				current: 0,
				interrupted: false,
			},
		}
	},
	computed: {
		...mapState(useAiStore, ['tokenizer', 'textModel']),
		...mapState(useSettingsStore, ['search']),
		similarityThresholdToUse() {
			return this.similarityThreshold || this.search.similarityThreshold
		},
		isLoaded() {
			return this.tokenizer && this.textModel
		},
	},
	methods: {
		onInterrupt() {
			this.progress.interrupted = true
		},
		async process() {
			if (!this.tokenizer || !this.textModel) {
				return
			}

			if (this.directory) {
				this.progress.total = await this.$vectorDB.countLocal(this.directory)
			} else if (this.collection) {
				this.progress.total = await this.$vectorDB.countRemote(this.collection)
			}
			this.progress.current = 0

			const inputs = this.tokenizer([this.searchTerm], {
				padding: true,
				truncation: true,
			})
			const { text_embeds } = await this.textModel(inputs)

			const candidates = [] as ImageResult[]

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			const process = (entry: VectorEntry): boolean => {
				const similarity = cos_sim(text_embeds[0].data, Array.from(entry.embedding))

				if (similarity >= this.similarityThresholdToUse) {
					candidates.push({
						uri: parseURI(entry.uri),
						similarity,
					} as ImageResult)
				}

				delayedProgression.add(1)
				return !this.progress.interrupted
			}

			if (this.directory) {
				await this.$vectorDB.iterateLocal(this.directory, process)
			} else if (this.collection) {
				await this.$vectorDB.iterateRemote(this.collection, process)
			}

			candidates.sort((a, b) => b.similarity - a.similarity)
			this.$emit('searchResult', candidates)
		},
		async onSearch() {
			try {
				await this.process()
			} catch (e) {
				console.error(e)
			}
			this.progress.total = 0
			this.progress.interrupted = false
		},
	},
})
</script>

<style scoped></style>
