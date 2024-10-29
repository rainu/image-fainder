import { defineStore } from 'pinia'
import { PreTrainedModel, PreTrainedTokenizer, Processor } from '@huggingface/transformers'

export const useFileStore = defineStore('file', {
	state: () => ({
		mainDirectory: null as FileSystemDirectoryHandle | null,
	}),
	actions: {
		setMainDirectory(dir: FileSystemDirectoryHandle) {
			this.mainDirectory = dir
		},
	},
})
