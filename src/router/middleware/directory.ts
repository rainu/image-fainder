import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useFileStore } from "../../store/file.ts"
import { RouteHome } from "../index.ts"

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

	next({ name: RouteHome })
}
