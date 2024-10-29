import { App, Plugin } from 'vue'
declare const __PROJECT_NAME__: string

const vectorStoreName = 'vector'
const dirIndexName = 'directorIdx'
const pathIndexName = 'pathIdx'

export type VectorEntryKey = IDBValidKey
export type VectorEntry = {
	id?: VectorEntryKey
	directory: string
	path: string
	embedding: Float32Array
}
export type PersistedVectorEntry = {
	id: VectorEntryKey
} & VectorEntry

export interface VectorDatabase {
	count(directory: string | null): Promise<number>

	getKeys(): Promise<VectorEntryKey[]>

	getByKey(key: VectorEntryKey): Promise<PersistedVectorEntry>

	getByPath(path: string): Promise<PersistedVectorEntry>

	exists(path: string): Promise<boolean>

	iterate(directory: string | null, clb: (e: PersistedVectorEntry) => boolean): Promise<void>

	save(entry: VectorEntry): Promise<void>

	delete(key: VectorEntryKey): Promise<void>
}

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$vectorDB: VectorDatabase
	}
}

export function createVectorDatabase(): Promise<Plugin> {
	const handle = (database: IDBDatabase): VectorDatabase => ({
		count(directory: string | null): Promise<number> {
			const store = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName)

			let req: IDBRequest<number>;
			if (directory) {
				req = store.index(dirIndexName).count(directory)
			} else {
				req = store.count()
			}

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve(req.result)
				req.onerror = reject
			})
		},
		exists(path: string): Promise<boolean> {
			const req = database
				.transaction(vectorStoreName, 'readonly')
				.objectStore(vectorStoreName)
				.index(pathIndexName)
				.count(path)

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve(!!req.result)
				req.onerror = reject
			})
		},
		iterate(directory: string | null, clb: (e: PersistedVectorEntry) => boolean): Promise<void> {
			const store = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName)

			let req: IDBRequest<IDBCursorWithValue | null>
			if (directory) {
				req = store.index(dirIndexName).openCursor(IDBKeyRange.only(directory))
			} else {
				req = store.openCursor()
			}

			return new Promise((resolve, reject) => {
				req.onsuccess = () => {
					const cursor = req.result as IDBCursorWithValue
					if (cursor) {
						const shouldContinue = clb({
							id: cursor.primaryKey,
							...cursor.value,
						} as PersistedVectorEntry)
						if (shouldContinue) {
							cursor.continue()
						}
					} else {
						resolve()
					}
				}
				req.onerror = reject
			})
		},
		getKeys(): Promise<VectorEntryKey[]> {
			const req = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName).getAllKeys()

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve(req.result)
				req.onerror = reject
			})
		},
		getByKey(key: VectorEntryKey): Promise<PersistedVectorEntry> {
			const req = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName).get(key)

			return new Promise((resolve, reject) => {
				req.onsuccess = () =>
					resolve({
						id: key,
						...req.result,
					})
				req.onerror = reject
			})
		},
		getByPath(path: string): Promise<PersistedVectorEntry> {
			const req = database
				.transaction(vectorStoreName, 'readonly')
				.objectStore(vectorStoreName)
				.index(pathIndexName)
				.getKey(path)

			return new Promise((resolve, reject) => {
				req.onsuccess = async () => {
					try {
						resolve(await this.getByKey(req.result as VectorEntryKey))
					} catch (e) {
						reject(e)
					}
				}
				req.onerror = reject
			})
		},
		delete(key: VectorEntryKey): Promise<void> {
			const req = database.transaction(vectorStoreName, 'readwrite').objectStore(vectorStoreName).delete(key)

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve()
				req.onerror = reject
			})
		},
		save(entry: VectorEntry): Promise<void> {
			const req = database.transaction(vectorStoreName, 'readwrite').objectStore(vectorStoreName).put(entry)

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve()
				req.onerror = reject
			})
		},
	})

	return new Promise((resolve, reject) => {
		const req = window.indexedDB.open(__PROJECT_NAME__, 1)

		req.onerror = reject
		req.onupgradeneeded = () => {
			const db = req.result

			const vectorStore = db.createObjectStore(vectorStoreName, {
				autoIncrement: true,
			})
			vectorStore.createIndex(pathIndexName, 'path', { unique: true })
			vectorStore.createIndex(dirIndexName, 'directory', { unique: false })
		}
		req.onsuccess = () => {
			const db = req.result as IDBDatabase
			resolve({
				install(app: App) {
					app.config.globalProperties.$vectorDB = handle(db)
				},
			})
		}
	})
}
