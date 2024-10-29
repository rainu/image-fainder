import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useFileStore } from "../../store/file.ts"

export function directoryMiddleware(
	to: RouteLocationNormalized,
	from: RouteLocationNormalized,
	next: NavigationGuardNext,
) {
	const fileStore = useFileStore()
	if (fileStore.mainDirectory) {
		next()
		return
	}

	next('/') // Redirect to home if directory parameter is missing
}
