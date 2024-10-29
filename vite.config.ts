import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { name } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
	base: `/${name}/`,
	plugins: [vue()],
	define: {
		__PROJECT_NAME__: JSON.stringify(name),
	},
	build: {
		target: 'esnext',
	},
})
