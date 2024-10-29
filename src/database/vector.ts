const vectorStoreName = 'vector'
const dirIndexName = 'directorIdx'
const pathIndexName = 'pathIdx'

export type VectorEntryKey = IDBValidKey
export type VectorEntry = {
	id: VectorEntryKey
	directory: string
	path: string
	embedding: Float32Array
}

export interface VectorDatabase {
	count(directory: string | null): Promise<number>

	getKeys(): Promise<[VectorEntryKey]>

	getByKey(key: VectorEntryKey): Promise<VectorEntry>

	getByPath(path: string): Promise<VectorEntry>

	exists(path: string): Promise<boolean>

	iterate(directory: string | null, clb: (e: VectorEntry) => boolean): Promise<void>

	save(entry: VectorEntry): Promise<void>

	delete(key: VectorEntryKey): Promise<void>
}

export function createVectorDatabase(): Promise<Plugin> {
	const handle = (database: IDBDatabase): VectorDatabase => ({
		count(directory: string | null): Promise<number> {
			let req = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName)

			if (directory) {
				req = req.index(dirIndexName).count(directory)
			} else {
				req = req.count()
			}

			return new Promise((resolve, reject) => {
				req.onsuccess = (e) => resolve(e.target.result)
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
				req.onsuccess = (e) => resolve(!!e.target.result)
				req.onerror = reject
			})
		},
		iterate(directory: string | null, clb: (e: VectorEntry) => boolean): Promise<void> {
			let req = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName)

			if (directory) {
				req = req.index(dirIndexName).openCursor(IDBKeyRange.only(directory))
			} else {
				req = req.openCursor()
			}

			return new Promise((resolve, reject) => {
				req.onsuccess = (e) => {
					const cursor = e.target.result as IDBCursorWithValue
					if (cursor) {
						const shouldContinue = clb({
							id: cursor.primaryKey,
							...cursor.value,
						} as VectorEntry)
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
		getKeys(): Promise<[VectorEntryKey]> {
			const req = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName).getAllKeys()

			return new Promise((resolve, reject) => {
				req.onsuccess = (e) => resolve(e.target.result)
				req.onerror = reject
			})
		},
		getByKey(key: VectorEntryKey): Promise<VectorEntry> {
			const req = database.transaction(vectorStoreName, 'readonly').objectStore(vectorStoreName).get(key)

			return new Promise((resolve, reject) => {
				req.onsuccess = (e) =>
					resolve({
						id: key,
						...e.target.result,
					})
				req.onerror = reject
			})
		},
		getByPath(path: string): Promise<VectorEntry> {
			const req = database
				.transaction(vectorStoreName, 'readonly')
				.objectStore(vectorStoreName)
				.index(pathIndexName)
				.getKey(path)

			return new Promise((resolve, reject) => {
				req.onsuccess = async (e) => {
					try {
						resolve(await this.getByKey(e.target.result as VectorEntryKey))
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
				req.onsuccess = (e) => resolve()
				req.onerror = reject
			})
		},
		save(entry: VectorEntry): Promise<void> {
			const req = database.transaction(vectorStoreName, 'readwrite').objectStore(vectorStoreName).put(entry)

			return new Promise((resolve, reject) => {
				req.onsuccess = (e) => resolve()
				req.onerror = reject
			})
		},
	})

	return new Promise((resolve, reject) => {
		const req = window.indexedDB.open(__PROJECT_NAME__, 1)

		req.onerror = reject
		req.onupgradeneeded = (event) => {
			const db = event.target.result as IDBDatabase

			const vectorStore = db.createObjectStore(vectorStoreName, {
				autoIncrement: true,
			})
			vectorStore.createIndex(pathIndexName, 'path', { unique: true })
			vectorStore.createIndex(dirIndexName, 'directory', { unique: false })
		}
		req.onsuccess = (event) => {
			const db = event.target.result as IDBDatabase
			resolve({
				install(app: App) {
					app.config.globalProperties.$vectorDB = handle(db)
				},
			})
		}
	})
}
