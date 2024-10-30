import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { createVectorDatabase } from './database/vector'

import { createI18n, I18nOptions } from "vue-i18n"
import i18n from "./i18n/index"


// Vuetify
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import appRouter from './router/index'

import App from './App.vue'
import { useAiStore } from './store/ai.ts'

//database
const database = await createVectorDatabase()
const pinia = createPinia()

const vuetify = createVuetify({
	components,
	directives,
})

//APP
let app = createApp(App)
app = app.use(pinia)
await useAiStore().detectDevice()

app = app.use(database)
app = app.use(appRouter)

const i18nInstance = createI18n({
	locale: i18n.defaultLocale,
	availableLocales: i18n.locales,
	messages: {
		...i18n.localeMappings
	},
})
app = app.use(i18nInstance)
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$i18n: I18nOptions
		$t: typeof i18nInstance.global.t
	}
}

app = app.use(vuetify)
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$vuetify: typeof vuetify
	}
}

app.mount('#app')
