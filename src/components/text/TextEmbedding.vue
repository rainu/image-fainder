<template>
	<v-container>
		<v-text-field
			v-model="searchTerm"
			@click:append-inner="onSearch"
			@keydown.enter.prevent="onSearch"
			:disabled="progress.total > 0"
			label="Search similar"
			variant="solo"
			single-line
			hide-details
			density="compact"
			append-inner-icon="mdi-magnify"
		>
		</v-text-field>
		<ProgressDialog title="Searching" :current="progress.current" :total="progress.total" />
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
import ProgressDialog from "../progress/Dialog.vue"
import { useSettingsStore } from "../../store/settings.ts"
import { delayProgress } from "../progress/delayed.ts"

export interface ImageResult {
	path: string
	similarity: number
}

export default defineComponent({
	name: 'TextEmbedding',
	components: { ProgressDialog, ProgressBar, ClipTextModelLoader, AutoTokenizerLoader },
	props: {
		directory: {
			type: String,
			required: false,
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
				total: null as Number | null,
				current: null as Number | null,
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
		async process() {
			this.progress.total = await this.$vectorDB.count(this.directory)
			this.progress.current = 0

			const inputs = this.tokenizer([this.searchTerm], {
				padding: true,
				truncation: true,
			})
			const { text_embeds } = await this.textModel(inputs)

			const candidates = [] as ImageResult[]

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			const process = (entry: VectorEntry): boolean => {
				const similarity = cos_sim(text_embeds[0].data, entry.embedding)

				if (similarity >= this.similarityThresholdToUse) {
					candidates.push({
						path: entry.path,
						similarity,
					} as ImageResult)
				}

				delayedProgression.add(1)
				return true
			}
			await this.$vectorDB.iterate(this.directory, process)

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
		},
	},
})
</script>

<style scoped></style>
