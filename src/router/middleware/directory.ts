import { NavigationGuardNext, NavigationGuardWithThis, RouteLocationNormalized } from "vue-router"
import { useFileStore } from "../../store/file.ts"
import { RouteHome } from "../index.ts"

export const directoryMiddleware: NavigationGuardWithThis<undefined> = (
	_to: RouteLocationNormalized,
	_from: RouteLocationNormalized,
	next: NavigationGuardNext,
) => {
	const fileStore = useFileStore()
	if (fileStore.mainDirectory) {
		next()
		return
	}

	next({ name: RouteHome })
}
