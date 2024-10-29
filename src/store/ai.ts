import { defineStore } from 'pinia'
import { PreTrainedModel, PreTrainedTokenizer, Processor } from '@huggingface/transformers'

export const useAiStore = defineStore('ai', {
	state: () => ({
		tokenizer: null as PreTrainedTokenizer | null,
		processor: null as Processor | null,
		textModel: null as PreTrainedModel | null,
		visionModel: null as PreTrainedModel | null,
	}),
	actions: {
		setTokenizer(tokenizer: PreTrainedTokenizer) {
			this.tokenizer = tokenizer
		},
		setProcessor(processor: Processor) {
			this.processor = processor
		},
		setTextModel(textModel: PreTrainedModel) {
			this.textModel = textModel
		},
		setVisionModel(visionModel: PreTrainedModel) {
			this.visionModel = visionModel
		},
	},
})
