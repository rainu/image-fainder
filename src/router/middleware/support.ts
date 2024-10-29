import { NavigationGuardNext, NavigationGuardWithThis, RouteLocationNormalized } from "vue-router"
import { RouteUnsupported } from "../index.ts"

export const supportMiddleware: NavigationGuardWithThis<undefined> = (
	_to: RouteLocationNormalized,
	_from: RouteLocationNormalized,
	next: NavigationGuardNext,
) => {

	const fail = (reason: string) => {
		next({ name: RouteUnsupported, query: { reason: reason } })
	}

	if(!window.showDirectoryPicker){
		fail("showDirectoryPicker not supported")
		return
	}
	if(!window.indexedDB){
		fail("indexedDB not supported")
		return
	}
	next()
}
