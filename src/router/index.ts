import { createRouter, createWebHashHistory, RouteLocationGeneric, Router } from "vue-router"

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$router: Router
		$route: RouteLocationGeneric
	}
}

import { directoryMiddleware } from './middleware/directory.ts'
import { supportMiddleware } from './middleware/support.ts'

export const RouteHome = 'home'
export const RouteUnsupported = 'unsupported'
export const RouteDirectory = 'directory'
export const RouteDirectoryAnalyse = RouteDirectory + '-analyse'
export const RouteDirectorySearch = RouteDirectory + '-search'
export const RouteImport = 'import'
export const RouteExport = 'export'

export default createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			name: RouteHome,
			path: '/',
			beforeEnter: supportMiddleware,
			component: () => import('../views/Home.vue'),
		},
		{
			name: RouteImport,
			path: '/exchange/import',
			beforeEnter: supportMiddleware,
			component: () => import('../views/Import.vue'),
		},
		{
			name: RouteExport,
			path: '/exchange/export',
			beforeEnter: supportMiddleware,
			component: () => import('../views/Export.vue'),
		},
		{
			path: '/directory',
			beforeEnter: [supportMiddleware, directoryMiddleware],
			children: [
				{
					name: RouteDirectory,
					path: '',
					component: () => import('../views/directory/Index.vue'),
				},
				{
					name: RouteDirectoryAnalyse,
					path: 'analyse',
					component: () => import('../views/directory/Analyse.vue'),
				},
				{
					name: RouteDirectorySearch,
					path: 'search',
					component: () => import('../views/directory/Search.vue'),
				}
			]
		},
		{
			name: RouteUnsupported,
			path: '/unsupported',
			component: () => import('../views/Unsupported.vue'),
		},
	],
})

