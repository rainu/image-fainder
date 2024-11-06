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
import { useAiStore } from '../../store/ai'
import AutoTokenizerLoader from './AutoTokenizerLoader.vue'
import ClipTextModelLoader from './ClipTextModelLoader.vue'
import ProgressBar from '../progress/Bar.vue'
import ProgressDialog from '../progress/Dialog.vue'
import { useSettingsStore } from '../../store/settings.ts'
import { ParsedURI } from '../../database/uri.ts'
import { createWorker, SimilarityWorker } from '../../worker/similarity.ts'
import { delayProgress } from '../progress/delayed.ts'
import { VectorEntryKey } from '../../database/vector.ts'

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
			worker: [] as SimilarityWorker[],
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
			let keys = [] as VectorEntryKey[]
			if (this.directory) {
				keys = await this.$vectorDB.getLocalDirectoryKeys(this.directory)
			} else if (this.collection) {
				keys = await this.$vectorDB.getRemoteCollectionKeys(this.collection)
			}

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			const handleCalcResult = (result: ImageResult | null): boolean => {
				if (result) {
					candidates.push(result)
				}

				delayedProgression.add(1)
				return !this.progress.interrupted
			}

			const promises = []
			const subArraySize = Math.ceil(keys.length / this.worker.length)
			for (let i = 0; i < this.worker.length; i++) {
				const vectorIds = keys.slice(i * subArraySize, (i + 1) * subArraySize)
				const promise = this.worker[i].calcSimilarities(
					{
						vector: text_embeds[0].data,
						vectorIds: vectorIds,
						similarityThreshold: this.similarityThresholdToUse,
					},
					handleCalcResult,
				)
				promises.push(promise)
			}
			await Promise.all(promises)

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
	mounted() {
		for (let i = 0; i < navigator.hardwareConcurrency; i++) {
			createWorker()
				.then((w) => this.worker.push(w))
				.catch((e) => console.error('Error while creating similarity worker!', e))
		}
	},
})
</script>

<style scoped></style>
