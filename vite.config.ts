import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { name } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
	base: `/${name}/`,
	plugins: [
		VitePWA({
			registerType: 'autoUpdate',
			devOptions: {
				enabled: true,
			},
			manifest: {
				name: name,
				short_name: name,
				description: 'A local AI powered image finder application.',
				start_url: `/${name}/`,
				background_color: '#ffffff',
				theme_color: '#000000',
				orientation: 'portrait-primary',
				display: 'standalone',
				icons: [
					{
						src: 'public/logo/48x48.png',
						sizes: '48x48',
						type: 'image/png',
					},
					{
						src: 'public/logo/72x72.png',
						sizes: '72x72',
						type: 'image/png',
					},
					{
						src: 'public/logo/96x96.png',
						sizes: '96x96',
						type: 'image/png',
					},
					{
						src: 'public/logo/128x128.png',
						sizes: '128x128',
						type: 'image/png',
					},
					{
						src: 'public/logo/144x144.png',
						sizes: '144x144',
						type: 'image/png',
					},
					{
						src: 'public/logo/152x152.png',
						sizes: '152x152',
						type: 'image/png',
					},
					{
						src: 'public/logo/192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'public/logo/384x384.png',
						sizes: '384x384',
						type: 'image/png',
					},
					{
						src: 'public/logo/512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
		}),
		vue(),
	],
	build: {
		target: 'esnext',
	},
})
