import { App, Plugin } from 'vue'
import { URI } from './uri.ts'
import { name as projectName } from '../../package.json'

const vectorTableName = 'vector'
const collectionTableName = 'collection'
const collectionIndexName = 'collectionIdx'
const uriIndexName = 'uriIdx'

export type VectorEntryKey = number
export type VectorEntry = {
	id?: VectorEntryKey
	collection: string
	uri: URI
	embedding: Float32Array
}
export type PersistedVectorEntry = {
	id: VectorEntryKey
} & VectorEntry

export type CollectionEntry = {
	name: string
}

interface VectorDatabaseInternal {
	count(directory: string | null): Promise<number>

	getCollections(): Promise<string[]>

	getCollectionKeys(collection: string): Promise<VectorEntryKey[]>

	iterate(collection: string | null, clb: (e: PersistedVectorEntry) => boolean): Promise<void>

	save(entry: VectorEntry): Promise<VectorEntryKey>

	deleteCollection(collection: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void>
}

export interface VectorDatabase {
	countLocal(directory: string): Promise<number>

	countRemote(collection: string): Promise<number>

	getLocalDirectories(): Promise<string[]>

	getRemoteCollections(): Promise<string[]>

	getKeys(): Promise<VectorEntryKey[]>

	getLocalDirectoryKeys(directory: string): Promise<VectorEntryKey[]>

	getRemoteCollectionKeys(collection: string): Promise<VectorEntryKey[]>

	getByKey(key: VectorEntryKey): Promise<PersistedVectorEntry>

	getByKeys(keys: VectorEntryKey[], clb: (e: PersistedVectorEntry) => void): Promise<void>

	getByURI(uri: URI): Promise<PersistedVectorEntry>

	exists(uri: URI): Promise<boolean>

	iterateLocal(directory: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void>

	iterateRemote(collection: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void>

	saveLocal(entry: VectorEntry): Promise<VectorEntryKey>

	saveRemote(entry: VectorEntry): Promise<VectorEntryKey>

	delete(key: VectorEntryKey): Promise<void>

	deleteLocal(directory: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void>

	deleteRemote(collection: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void>
}

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$vectorDB: VectorDatabase
	}
}

const localCollectionName = (directory: string) => directory

const remoteCollectionPrefix = 'remote/'
const remoteCollectionName = (collection: string) => remoteCollectionPrefix + collection
const isRemoteCollection = (collection: string) => collection.startsWith(remoteCollectionPrefix)
const remoteCollectionToName = (collection: string) => collection.slice(remoteCollectionPrefix.length)

export function createVectorDatabase(): Promise<Plugin & { handle: VectorDatabase }> {
	const handle = (database: IDBDatabase): VectorDatabase & VectorDatabaseInternal => ({
		count(collection: string | null): Promise<number> {
			const store = database.transaction(vectorTableName, 'readonly').objectStore(vectorTableName)

			let req: IDBRequest<number>
			if (collection) {
				req = store.index(collectionIndexName).count(collection)
			} else {
				req = store.count()
			}

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve(req.result)
				req.onerror = reject
			})
		},
		countLocal(directory: string): Promise<number> {
			return this.count(localCollectionName(directory))
		},
		countRemote(collection: string): Promise<number> {
			return this.count(remoteCollectionName(collection))
		},
		exists(uri: URI): Promise<boolean> {
			const req = database
				.transaction(vectorTableName, 'readonly')
				.objectStore(vectorTableName)
				.index(uriIndexName)
				.count(uri)

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve(!!req.result)
				req.onerror = reject
			})
		},
		iterate(collection: string | null, clb: (e: PersistedVectorEntry) => boolean): Promise<void> {
			const store = database.transaction(vectorTableName, 'readonly').objectStore(vectorTableName)

			let req: IDBRequest<IDBCursorWithValue | null>
			if (collection) {
				req = store.index(collectionIndexName).openCursor(IDBKeyRange.only(collection))
			} else {
				req = store.openCursor()
			}

			return new Promise((resolve, reject) => {
				req.onsuccess = () => {
					const cursor = req.result as IDBCursorWithValue
					if (cursor) {
						const shouldContinue = clb({ id: cursor.primaryKey, ...cursor.value } as PersistedVectorEntry)
						if (shouldContinue) {
							cursor.continue()
						} else {
							resolve()
						}
					} else {
						resolve()
					}
				}
				req.onerror = reject
			})
		},
		iterateLocal(directory: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void> {
			return this.iterate(localCollectionName(directory), clb)
		},
		iterateRemote(collection: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void> {
			return this.iterate(remoteCollectionName(collection), (e) => {
				//sanitize collection name
				e.collection = remoteCollectionToName(e.collection)
				return clb(e)
			})
		},
		async getCollections(): Promise<string[]> {
			const req = database.transaction(collectionTableName, 'readonly').objectStore(collectionTableName).getAll()

			return new Promise((resolve, reject) => {
				req.onsuccess = () => {
					const result: CollectionEntry[] = req.result
					resolve(result.map((entry) => entry.name))
				}
				req.onerror = reject
			})
		},
		getLocalDirectories(): Promise<string[]> {
			return this.getCollections().then((collections) => {
				return collections.filter((collection) => !isRemoteCollection(collection))
			})
		},
		getRemoteCollections(): Promise<string[]> {
			return this.getCollections().then((collections) => {
				return collections.filter(isRemoteCollection).map(remoteCollectionToName)
			})
		},
		getKeys(): Promise<VectorEntryKey[]> {
			const req = database.transaction(vectorTableName, 'readonly').objectStore(vectorTableName).getAllKeys()

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve(req.result.map((k) => Number(k)))
				req.onerror = reject
			})
		},
		getCollectionKeys(collection: string): Promise<VectorEntryKey[]> {
			const req = database
				.transaction(vectorTableName, 'readonly')
				.objectStore(vectorTableName)
				.index(collectionIndexName)
				.getAllKeys(collection)

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve(req.result.map((k) => Number(k)))
				req.onerror = reject
			})
		},
		getLocalDirectoryKeys(directory: string): Promise<VectorEntryKey[]> {
			return this.getCollectionKeys(localCollectionName(directory))
		},
		getRemoteCollectionKeys(collection: string): Promise<VectorEntryKey[]> {
			return this.getCollectionKeys(remoteCollectionName(collection))
		},
		getByKey(key: VectorEntryKey): Promise<PersistedVectorEntry> {
			const req = database.transaction(vectorTableName, 'readonly').objectStore(vectorTableName).get(key)

			return new Promise((resolve, reject) => {
				req.onsuccess = () => {
					resolve({
						id: key,
						...req.result,
					})
				}
				req.onerror = reject
			})
		},
		getByKeys(keys: VectorEntryKey[], clb: (e: PersistedVectorEntry) => void): Promise<void> {
			//the keypoint in this function is to open only one transaction
			const tc = database.transaction(vectorTableName, 'readonly').objectStore(vectorTableName)

			const promises = []
			for (let key of keys) {
				const req = tc.get(key)
				const p = new Promise<PersistedVectorEntry>((resolve, reject) => {
					req.onsuccess = () => resolve({ id: key, ...req.result } as PersistedVectorEntry)
					req.onerror = reject
				}).then((e) => clb(e))
				promises.push(p)
			}

			return Promise.all(promises).then(() => {})
		},
		getByURI(uri: URI): Promise<PersistedVectorEntry> {
			const req = database
				.transaction(vectorTableName, 'readonly')
				.objectStore(vectorTableName)
				.index(uriIndexName)
				.getKey(uri)

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
			const req = database.transaction(vectorTableName, 'readwrite').objectStore(vectorTableName).delete(key)

			return new Promise((resolve, reject) => {
				req.onsuccess = () => resolve()
				req.onerror = reject
			})
		},
		deleteCollection(collection: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void> {
			const tx = database.transaction([vectorTableName, collectionTableName], 'readwrite')
			const vectorReq = tx
				.objectStore(vectorTableName)
				.index(collectionIndexName)
				.openCursor(IDBKeyRange.only(collection))

			return new Promise((resolve, reject) => {
				vectorReq.onsuccess = () => {
					const cursor = vectorReq.result as IDBCursorWithValue
					if (cursor) {
						cursor.delete()

						const shouldContinue = clb({ id: cursor.primaryKey, ...cursor.value } as PersistedVectorEntry)
						if (shouldContinue) {
							cursor.continue()
						} else {
							resolve(true)
						}
					} else {
						resolve(false)
					}
				}
				vectorReq.onerror = reject
			}).then((interrupted) => {
				if (interrupted) {
					return
				}

				const collectionReq = tx.objectStore(collectionTableName).delete(collection)

				return new Promise((resolve, reject) => {
					collectionReq.onsuccess = () => resolve()
					collectionReq.onerror = reject
				}) as Promise<void>
			})
		},
		deleteLocal(directory: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void> {
			return this.deleteCollection(localCollectionName(directory), clb)
		},
		deleteRemote(collection: string, clb: (e: PersistedVectorEntry) => boolean): Promise<void> {
			return this.deleteCollection(remoteCollectionName(collection), clb)
		},
		save(entry: VectorEntry): Promise<VectorEntryKey> {
			const tx = database.transaction([vectorTableName, collectionTableName], 'readwrite')
			const vectorReq = tx.objectStore(vectorTableName).put(entry, entry.id)
			const collectionReq = tx.objectStore(collectionTableName).put({ name: entry.collection } as CollectionEntry)

			return Promise.all([
				new Promise((resolve, reject) => {
					vectorReq.onsuccess = () => resolve(Number(vectorReq.result))
					vectorReq.onerror = reject
				}) as Promise<VectorEntryKey>,
				new Promise((resolve, reject) => {
					collectionReq.onsuccess = () => resolve()
					collectionReq.onerror = reject
				}) as Promise<void>,
			]).then(([vectorKey, _]) => vectorKey as VectorEntryKey)
		},
		saveLocal(entry: VectorEntry): Promise<VectorEntryKey> {
			return this.save({
				...entry,
				collection: localCollectionName(entry.collection),
			})
		},
		saveRemote(entry: VectorEntry): Promise<VectorEntryKey> {
			return this.save({
				...entry,
				collection: remoteCollectionName(entry.collection),
			})
		},
	})

	return new Promise((resolve, reject) => {
		const req = indexedDB.open(projectName, 1)

		req.onerror = reject
		req.onupgradeneeded = () => {
			const db = req.result

			const vectorTable = db.createObjectStore(vectorTableName, {
				autoIncrement: true,
			})
			vectorTable.createIndex(uriIndexName, 'uri', { unique: true })
			vectorTable.createIndex(collectionIndexName, 'collection', { unique: false })

			db.createObjectStore(collectionTableName, { keyPath: 'name' })
		}
		req.onsuccess = () => {
			const db = req.result as IDBDatabase
			const dbHandle = handle(db)
			resolve({
				install(app: App) {
					app.config.globalProperties.$vectorDB = dbHandle
				},
				handle: dbHandle,
			})
		}
	})
}
