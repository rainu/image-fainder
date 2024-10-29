import { createRouter, createWebHashHistory } from 'vue-router'
import { directoryMiddleware } from './middleware/directory.ts'

export const RouteHome = 'home'
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
			component: () => import('../views/Home.vue'),
		},
		{
			name: RouteImport,
			path: '/exchange/import',
			component: () => import('../views/Import.vue'),
		},
		{
			name: RouteExport,
			path: '/exchange/export',
			component: () => import('../views/Export.vue'),
		},
		{
			path: '/directory',
			beforeEnter: directoryMiddleware,
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
		}
	],
})
