<template>
	<v-container v-show="progress !== 100">
		<v-row align-content="center" justify="center" dense>
			<v-col cols="12" class="text-subtitle-1 text-center">Loading processor </v-col>
			<v-col cols="10">
				<ProgressBar :current="progress" :total="100" hide-steps />
			</v-col>
		</v-row>
	</v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AutoProcessor } from '@huggingface/transformers'
import { useAiStore } from '../../store/ai.ts'
import { mapActions, mapState } from 'pinia'
import ProgressBar from '../progress/Bar.vue'

export default defineComponent({
	name: 'ProcessorLoader',
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
		...mapState(useAiStore, ['processor']),
	},
	methods: {
		...mapActions(useAiStore, ['setProcessor']),
		async load() {
			if (this.modelValue) {
				this.progress = 100
				return
			}
			const model = await AutoProcessor.from_pretrained(this.modelName, {
				progress_callback: (progress) => {
					if (progress.progress) {
						this.progress = progress.progress
					}
				},
				device: 'webgpu',
			})
			this.progress = 100
			this.setProcessor(model)
		},
	},
	mounted() {
		this.load()
	},
})
</script>

<style scoped></style>
