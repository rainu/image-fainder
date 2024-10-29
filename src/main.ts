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

const database = await createVectorDatabase()
const pinia = createPinia()

const vuetify = createVuetify({
	components,
	directives,
})

createApp(App).use(pinia).use(database).use(router).use(vuetify).mount('#app')
