import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { createVectorDatabase } from './database/vector'

// Vuetify
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import router from './router/index'

import App from './App.vue'
import { useAiStore } from './store/ai.ts'

const database = await createVectorDatabase()
const pinia = createPinia()

const vuetify = createVuetify({
	components,
	directives,
})

let app = createApp(App)
app = app.use(pinia)
await useAiStore().detectDevice()

app = app.use(database)
app = app.use(router)
app = app.use(vuetify)
app.mount('#app')
