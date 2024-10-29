import { defineStore } from 'pinia'

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
