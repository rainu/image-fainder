import { defineStore } from 'pinia'
declare const __PROJECT_NAME__: string

const storePrefix = `${__PROJECT_NAME__}:settings:`
const searchPrefix = `${storePrefix}:search:`

const keyTheme = storePrefix + 'theme'
const keyItemsPerPage = searchPrefix + 'itemsPerPage'
const keySimilarityThreshold = searchPrefix + 'similarityThreshold'
const keyShowSimilarity = searchPrefix + 'showSimilarity'

export const useSettingsStore = defineStore('settings', {
	state: () => {
		return {
			theme: localStorage.getItem(keyTheme) || 'light',
			search: {
				itemsPerPage: Number.parseInt(localStorage.getItem(keyItemsPerPage) || '25'),
				similarityThreshold: Number.parseFloat(localStorage.getItem(keySimilarityThreshold) || '0.1'),
				showSimilarity: Boolean(localStorage.getItem(keyShowSimilarity)),
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
		}
	},
})
