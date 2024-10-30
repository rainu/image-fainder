import { VectorDatabase } from '../../database/vector.ts'
import { parseURI } from "../../database/uri.ts"

type MetaData = {
	u: string
	d: number
}

type Entry = {
	Meta: MetaData
	Embedding: Float32Array
}

const magicNumber = 0x52494644	//ascii -> "RIFD"
const version = 1

export const exportFile = async (
	fileHandle: FileSystemFileHandle,
	vectorDB: VectorDatabase,
	progressCallback: (c: number, t: number) => void,
) => {
	const writableStream = await fileHandle.createWritable()

	const writeNumber = async (n: number) => {
		const arrayBuffer = new ArrayBuffer(4)
		const dataView = new DataView(arrayBuffer)
		dataView.setUint32(0, n, false) // true for big-endian
		await writableStream.write(new Uint8Array(arrayBuffer))
	}

	//[magicNumber][version]
	await writeNumber(magicNumber)
	await writeNumber(version)

	const keys = await vectorDB.getKeys()

	for (let k = 0; k < keys.length; k++) {
		const key = keys[k]
		progressCallback(k, keys.length)

		const item = await vectorDB.getByKey(key)
		const buffer = new ArrayBuffer(item.embedding.length * 4)
		const view = new Float32Array(buffer)
		for (let i = 0; i < item.embedding.length; i++) {
			view[i] = item.embedding[i]
		}

		const meta: MetaData = {
			u: item.uri,
			d: item.embedding.length,
		}
		const json = JSON.stringify(meta)

		//[json-length][json][embedding]
		await writeNumber(json.length)
		await writableStream.write(json)
		await writableStream.write(buffer)
	}
	await writableStream.close()
}

const fileReader = (file: File) => ({
	total: file.size,
	offset: 0,
	readNBytes(n: number): Promise<ArrayBuffer> {
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
		return dataView.getInt32(0, false) // false for big-endian
	},
	async readNextJson() {
		const jsonLength = await this.readNumber()
		const json = await this.readNBytes(jsonLength)
		return JSON.parse(new TextDecoder().decode(json))
	},
	async readNext(version: number): Promise<Entry> {
		// version -> parser-function
		const parser: Record<number, () => Promise<Entry>> = {
			1: async (): Promise<Entry> => {
				const meta = (await this.readNextJson()) as {
					f: string
					d: number
				}
				const raw = await this.readNBytes(meta.d * 4)
				return {
					Meta: {
						u: `file://` + meta.f,
						d: meta.d,
					},
					Embedding: new Float32Array(raw),
				}
			},
		}

		return parser[version as keyof typeof parser]()
	},
})

export const importFile = async (
	fileHandle: FileSystemFileHandle,
	vectorDB: VectorDatabase,
	progressCallback: (c: number, t: number) => void,
) => {
	const file = fileReader(await fileHandle.getFile())
	const givenMagicNumber = await file.readNumber()
	if (givenMagicNumber !== magicNumber) {
		throw new Error('Invalid file format')
	}
	const fileVersion = await file.readNumber()
	if (fileVersion > version) {
		throw new Error('Invalid file version')
	}

	while (true) {
		progressCallback(file.offset, file.total)

		let entry
		try {
			entry = await file.readNext(fileVersion)
		} catch (e) {
			break
		}

		if (await vectorDB.exists(entry.Meta.u)) {
			const persisted = await vectorDB.getByURI(entry.Meta.u)
			await vectorDB.delete(persisted.id)
		}
		const parsedURI = parseURI(entry.Meta.u)
		if (parsedURI === null) {
			throw new Error('Unknown URI type')
		}

		await vectorDB.save({
			collection: parsedURI.directory,
			uri: entry.Meta.u,
			embedding: entry.Embedding,
		})
	}
}
