import { defineStore } from 'pinia'
import { name as projectName } from '../../package.json'

const storePrefix = `${projectName}:settings:`
const searchPrefix = `${storePrefix}search:`
const modelPrefix = `${storePrefix}model:`

const keyTheme = storePrefix + 'theme'
const keyLocale = storePrefix + 'locale'
const keyItemsPerPage = searchPrefix + 'itemsPerPage'
const keySimilarityThreshold = searchPrefix + 'similarityThreshold'
const keyShowSimilarity = searchPrefix + 'showSimilarity'
const keyModelVision = modelPrefix + 'vision'
const keyModelText = modelPrefix + 'text'
const keyModelProcessor = modelPrefix + 'processor'
const keyModelTokenizer = modelPrefix + 'tokenizer'

export const useSettingsStore = defineStore('settings', {
	state: () => {
		return {
			theme: localStorage.getItem(keyTheme) || 'light',
			locale: localStorage.getItem(keyLocale) || 'en',
			search: {
				itemsPerPage: Number.parseInt(localStorage.getItem(keyItemsPerPage) || '25'),
				similarityThreshold: Number.parseFloat(localStorage.getItem(keySimilarityThreshold) || '0.1'),
				showSimilarity: localStorage.getItem(keyShowSimilarity) === 'true',
			},
			model: {
				vision: localStorage.getItem(keyModelVision) || 'jinaai/jina-clip-v1',
				text: localStorage.getItem(keyModelText) || 'jinaai/jina-clip-v1',
				processor: localStorage.getItem(keyModelProcessor) || 'Xenova/clip-vit-base-patch32',
				tokenizer: localStorage.getItem(keyModelTokenizer) || 'jinaai/jina-clip-v1'
			}
		}
	},
	actions: {
		toggleTheme() {
			if(this.theme === 'dark') {
				this.theme = 'light'
			} else {
				this.theme = 'dark'
			}
			localStorage.setItem(keyTheme, this.theme)
		},
		setLocale(locale: string) {
			this.locale = locale
			localStorage.setItem(keyLocale, locale)
		},
		setItemsPerPage(value: number) {
			this.search.itemsPerPage = value
			localStorage.setItem(keyItemsPerPage, `${this.search.itemsPerPage}`)
		},
		setSimilarityThreshold(value: number) {
			this.search.similarityThreshold = value
			localStorage.setItem(keySimilarityThreshold, `${this.search.similarityThreshold}`)
		},
		setShowSimilarity(value: boolean) {
			this.search.showSimilarity = value
			localStorage.setItem(keyShowSimilarity, `${this.search.showSimilarity}`)
		},
		setModelVision(value: string) {
			this.model.vision = value
			localStorage.setItem(keyModelVision, this.model.vision)
		},
		setModelText(value: string) {
			this.model.text = value
			localStorage.setItem(keyModelText, this.model.text)
		},
		setModelProcessor(value: string) {
			this.model.processor = value
			localStorage.setItem(keyModelProcessor, this.model.processor)
		},
		setModelTokenizer(value: string) {
			this.model.tokenizer = value
			localStorage.setItem(keyModelTokenizer, this.model.tokenizer)
		},
	},
})
