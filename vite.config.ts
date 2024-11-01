import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { name } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
	base: `/${name}/`,
	plugins: [vue()],
	build: {
		target: 'esnext',
	},
})
