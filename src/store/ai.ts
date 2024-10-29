import { defineStore } from 'pinia'
import { PreTrainedModel, PreTrainedTokenizer, Processor } from '@huggingface/transformers'
import { DeviceType } from '@huggingface/transformers/types/utils/devices'

export const useAiStore = defineStore('ai', {
	state: () => ({
		device: {
			type: 'auto' as DeviceType,
			gpu: {
				adapter: null as GPUAdapter | null,
				device: null as GPUDevice | null,
			}
		},
		tokenizer: null as PreTrainedTokenizer | null,
		processor: null as Processor | null,
		textModel: null as PreTrainedModel | null,
		visionModel: null as PreTrainedModel | null,
	}),
	actions: {
		async detectDevice() {
			if (navigator.gpu) {
				try {
					const adapter = await navigator.gpu.requestAdapter()
					const device = await adapter.requestDevice()
					device.destroy()
					this.device.type = 'webgpu'
					this.device.gpu.adapter = adapter
					this.device.gpu.device = device
					return
				} catch (e) {
					console.warn('Error while detecting GPU', e)
				}
			}

			this.device.type = 'cpu'
			console.warn('No GPU detected')
		},
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
