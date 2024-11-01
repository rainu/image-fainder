import { createRouter, createWebHashHistory, RouteLocationGeneric, Router } from "vue-router"

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$router: Router
		$route: RouteLocationGeneric
	}
}

import { directoryMiddleware } from './middleware/directory.ts'
import { supportDatabase, supportLocal } from "./middleware/support.ts"

export const RouteHome = 'home'
export const RouteHelp = 'help'
export const RouteUnsupported = 'unsupported'
export const RouteDirectory = 'directory'
export const RouteDirectoryAnalyse = RouteDirectory + '-analyse'
export const RouteDirectorySearch = RouteDirectory + '-search'
export const RouteCollection = 'collection'
export const RouteCollectionAnalyse = RouteCollection + '-analyse'
export const RouteCollectionSearch = RouteCollection + '-search'
export const RouteImport = 'import'
export const RouteExport = 'export'

export default createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			name: RouteHome,
			path: '/',
			beforeEnter: supportDatabase,
			component: () => import('../views/Home.vue'),
		},
		{
			name: RouteImport,
			path: '/exchange/import',
			beforeEnter: supportDatabase,
			component: () => import('../views/Import.vue'),
		},
		{
			name: RouteExport,
			path: '/exchange/export',
			beforeEnter: supportDatabase,
			component: () => import('../views/Export.vue'),
		},
		{
			path: '/directory',
			beforeEnter: [supportLocal, supportDatabase],
			children: [
				{
					name: RouteDirectory,
					path: '',
					component: () => import('../views/directory/Index.vue'),
				},
				{
					name: RouteDirectoryAnalyse,
					path: 'analyse',
					beforeEnter: directoryMiddleware,
					component: () => import('../views/directory/Analyse.vue'),
				},
				{
					name: RouteDirectorySearch,
					path: 'search',
					beforeEnter: directoryMiddleware,
					component: () => import('../views/directory/Search.vue'),
				}
			]
		},
		{
			path: '/collection',
			beforeEnter: supportDatabase,
			children: [
				{
					name: RouteCollection,
					path: '',
					component: () => import('../views/collection/Index.vue'),
				},
				{
					path: ':collection',
					children: [
						{
							name: RouteCollectionAnalyse,
							path: 'analyse',
							component: () => import('../views/collection/Analyse.vue'),
						},
						{
							name: RouteCollectionSearch,
							path: 'search',
							component: () => import('../views/collection/Search.vue'),
						},
					]
				}
			]
		},
		{
			name: RouteHelp,
			path: '/help',
			beforeEnter: supportDatabase,
			component: () => import('../views/Help.vue'),
		},
		{
			name: RouteUnsupported,
			path: '/unsupported',
			component: () => import('../views/Unsupported.vue'),
		},
	],
})

