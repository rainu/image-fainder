/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_COMMIT_HASH: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}