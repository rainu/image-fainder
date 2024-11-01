import { NavigationGuardNext, NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'
import { RouteUnsupported } from '../index.ts'

export const supportDatabase: NavigationGuardWithThis<undefined> = (
	_to: RouteLocationNormalized,
	_from: RouteLocationNormalized,
	next: NavigationGuardNext,
) => {
	const fail = (reason: string) => {
		next({ name: RouteUnsupported, query: { reason: reason } })
	}

	if (!window.indexedDB) {
		fail('browser.feature.support.missing.indexedDB')
		return
	}
	next()
}

export const supportLocal: NavigationGuardWithThis<undefined> = (
	_to: RouteLocationNormalized,
	_from: RouteLocationNormalized,
	next: NavigationGuardNext,
) => {
	const fail = (reason: string) => {
		next({ name: RouteUnsupported, query: { reason: reason } })
	}

	if (!window.showDirectoryPicker) {
		fail('browser.feature.support.missing.showDirectoryPicker')
		return
	}
	next()
}