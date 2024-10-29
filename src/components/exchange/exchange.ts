import { VectorDatabase } from '../../database/vector.ts'

type MetaData = {
	f: string
	d: number
}

type Entry = {
	Meta: MetaData
	Embedding: Float32Array
}

export const exportFile = async (
	fileHandle,
	vectorDB: VectorDatabase,
	progressCallback: (c: number, t: number) => void,
) => {
	const writableStream = await fileHandle.createWritable()

	const keys = await vectorDB.getKeys()

	for (let k = 0, i = 0; k < keys.length; k++) {
		const key = keys[k]
		progressCallback(k, keys.length)

		const item = await vectorDB.getByKey(key)
		const buffer = new ArrayBuffer(item.embedding.length * 4)
		const view = new Float32Array(buffer)
		for (let i = 0; i < item.embedding.length; i++) {
			view[i] = item.embedding[i]
		}

		const meta: MetaData = {
			f: item.path,
			d: item.embedding.length,
		}
		const json = JSON.stringify(meta)

		const jlb = new ArrayBuffer(4)
		const jlbv = new DataView(jlb)
		jlbv.setInt32(0, json.length, true) // true for little-endian

		//[json-length][json][embedding]
		await writableStream.write(new Uint8Array(jlb))
		await writableStream.write(json)
		await writableStream.write(buffer)
	}
	await writableStream.close()
}

const fileReader = (file) => ({
	total: file.size,
	offset: 0,
	readNBytes(n: number) {
		const fileSlice = file.slice(this.offset, this.offset + n)
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => {
				this.offset += n
				resolve(reader.result as ArrayBuffer)
			}
			reader.onerror = reject
			reader.readAsArrayBuffer(fileSlice)
		})
	},
	async readNumber() {
		const arrayBuffer = await this.readNBytes(4)
		const dataView = new DataView(arrayBuffer)
		return dataView.getInt32(0, true) // true for little-endian
	},
	async readNextJson() {
		const jsonLength = await this.readNumber()
		const json = await this.readNBytes(jsonLength)
		return JSON.parse(new TextDecoder().decode(json))
	},
	async readNext(): Promise<Entry> {
		const meta = (await this.readNextJson()) as MetaData
		const raw = await this.readNBytes(meta.d * 4)
		return {
			Meta: meta,
			Embedding: new Float32Array(raw),
		}
	},
})

export const importFile = async (
	fileHandle,
	vectorDB: VectorDatabase,
	progressCallback: (c: number, t: number) => void,
) => {
	const file = fileReader(await fileHandle.getFile())

	while (true) {
		progressCallback(file.offset, file.total)

		let entry
		try {
			entry = await file.readNext()
		} catch (e) {
			break
		}

		if (await vectorDB.exists(entry.Meta.f)) {
			const persisted = await vectorDB.getByPath(entry.Meta.f)
			await vectorDB.delete(persisted.id)
		}
		await vectorDB.save({
			directory: entry.Meta.f.split('/')[0],
			path: entry.Meta.f,
			embedding: entry.Embedding,
		})
	}
}
