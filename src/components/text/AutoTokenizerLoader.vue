<template>
	<v-container v-show="progress !== 100">
		<v-row align-content="center" justify="center" dense>
			<v-col cols="12" class="text-subtitle-1 text-center">Loading tokenizer </v-col>
			<v-col cols="10">
				<ProgressBar :current="progress" :total="100" hide-steps />
			</v-col>
		</v-row>
	</v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AutoTokenizer } from '@huggingface/transformers'
import { mapActions, mapState } from 'pinia'
import { useAiStore } from '../../store/ai.ts'
import ProgressBar from '../progress/Bar.vue'

export default defineComponent({
	name: 'AutoTokenizerLoader',
	components: { ProgressBar },
	props: {
		modelName: {
			type: String,
			required: true,
		},
	},
	data() {
		return {
			progress: 0,
		}
	},
	computed: {
		...mapState(useAiStore, ['tokenizer']),
	},
	methods: {
		...mapActions(useAiStore, ['setTokenizer']),
		async load() {
			if (this.tokenizer) {
				this.progress = 100
				return
			}
			const tokenizer = await AutoTokenizer.from_pretrained(this.modelName, {
				progress_callback: (progress) => {
					if (progress.progress) {
						this.progress = progress.progress
					}
				},
				device: 'webgpu',
			})
			this.progress = 100
			this.setTokenizer(tokenizer)
		},
	},
	mounted() {
		this.load()
	},
})
</script>

<style scoped></style>
