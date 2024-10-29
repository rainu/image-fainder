declare global {
	interface Window {
		showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
		showSaveFilePicker: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>
		showOpenFilePicker: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
	}

	interface FileSystemDirectoryHandle {
		values(): AsyncIterableIterator<FileSystemDirectoryHandle>
	}

	interface FileSystemHandle {
		remove: (options?: { recursive: boolean }) => Promise<undefined>
	}

	interface GPUAdapter {
		info: {
			architecture?: string
			description?: string
			device?: string
			vendor?: string
		}
		features: {
			keys(): IterableIterator<string>
		}
		requestDevice(): Promise<GPUDevice>
	}

	interface GPUDevice {
		destroy(): void
	}

	interface Navigator {
		gpu: {
			requestAdapter: () => Promise<GPUAdapter>
		}
	}
}

export {}
