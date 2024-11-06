import { cos_sim } from '@huggingface/transformers'
import { createVectorDatabase, VectorDatabase, VectorEntryKey } from '../database/vector.ts'
import { parseURI } from '../database/uri.ts'
import { ImageResult } from '../components/text/TextEmbedding.vue'

type OutgoingMessage = OutgoingMessageReady | OutgoingMessageFailed | OutgoingMessageResult | OutgoingMessageDone
type OutgoingMessageReady = { type: 'READY' }
type OutgoingMessageFailed = { type: 'ERROR'; error: any }
type OutgoingMessageResult = { type: 'RESULT'; candidate: ImageResult | null }
type OutgoingMessageDone = { type: 'DONE' }

const sendMessage = (message: OutgoingMessage) => {
	postMessage(message)
}

type IncomingMessage = IncomingMessageInit | IncomingMessageCalc | IncomingMessageInterrupt
type IncomingMessageInit = {
	type: 'init'
}
type IncomingMessageCalc = {
	type: 'calc'
} & SimilarityParameters
type SimilarityParameters = {
	vector: number[]
	vectorIds: VectorEntryKey[]
	similarityThreshold: number
}
type IncomingMessageInterrupt = {
	type: 'interrupt'
}

const state = {
	$vectorDB: null as VectorDatabase | null,
	interrupted: false,
}

const handleInit = () => {
	createVectorDatabase()
		.then((db) => {
			state.$vectorDB = db.handle
			sendMessage({ type: 'READY' })
		})
		.catch((e) => {
			console.error('Worker: Failed to create VectorDB', e)
			sendMessage({ type: 'ERROR', error: e })
		})
}

const handleInterrupt = () => {
	state.interrupted = true
}

const handleCalc = (data: IncomingMessageCalc) => {
	state.interrupted = false

	new Promise<void>(async (resolve, reject) => {
		if (state.$vectorDB === null) {
			reject('VectorDB not initialized')
			return
		}

		await state.$vectorDB.getByKeys(data.vectorIds, (entry) => {
			//we cannot interrupt the database query, but we can interrupt further calculations
			if (state.interrupted) {
				resolve()
				return
			}

			const similarity = cos_sim(data.vector, Array.from(entry.embedding))
			if (similarity >= data.similarityThreshold) {
				const uri = parseURI(entry.uri)
				if (uri) {
					sendMessage({ type: 'RESULT', candidate: { uri, similarity } })
				}
			} else {
				sendMessage({ type: 'RESULT', candidate: null })
			}
		})
		resolve()
	})
		.then(() => sendMessage({ type: 'DONE' }))
		.catch((e) => sendMessage({ type: 'ERROR', error: e }))
}

onmessage = (message: MessageEvent<IncomingMessage>) => {
	const type = message.data.type
	switch (type) {
		case 'init':
			handleInit()
			return
		case 'calc':
			handleCalc(message.data)
			return
		case 'interrupt':
			handleInterrupt()
			return
	}
	console.error('Unknown message type', message)
}

const similarityWorker = (worker: Worker) => ({
	calcSimilarities(args: SimilarityParameters, clb: (r: ImageResult | null) => boolean): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			worker.onmessage = (
				message: MessageEvent<OutgoingMessageResult | OutgoingMessageFailed | OutgoingMessageDone>,
			) => {
				if (message.data.type === 'RESULT') {
					const shouldContinue = clb(message.data.candidate)
					if (!shouldContinue) {
						worker.postMessage({ type: 'interrupt' })
						resolve()
					}
				} else if (message.data.type === 'ERROR') {
					reject(message.data.error)
				} else if (message.data.type === 'DONE') {
					resolve()
				}
			}
			worker.onmessageerror = reject
			worker.onerror = reject
			worker.postMessage({ type: 'calc', ...args })
		})
	},
})
export type SimilarityWorker = ReturnType<typeof similarityWorker>

export const createWorker = (): Promise<SimilarityWorker> =>
	new Promise((resolve, reject) => {
		const worker = new Worker(new URL('./similarity', import.meta.url), { type: 'module' })
		worker.onmessage = (message) => {
			worker.onmessage = null

			const data = message.data
			if (data.type === 'READY') {
				resolve(similarityWorker(worker))
			} else if (data.type === 'ERROR') {
				reject(data.error)
			}
		}
		worker.postMessage({ type: 'init' })
	})
