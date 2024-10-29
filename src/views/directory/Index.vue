<template>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { RouteDirectoryAnalyse, RouteDirectorySearch } from '../../router'
import { useFileStore } from '../../store/file.ts'

export default defineComponent({
	beforeMount() {
		const name = useFileStore().mainDirectory?.name
		this.$vectorDB.count(name).then((c) => {
			if(c > 0) {
				console.log("goto search")
				this.$router.push({ name: RouteDirectorySearch })
			} else {
				console.log("goto analyse")
				this.$router.push({ name: RouteDirectoryAnalyse })
			}
		})
	}
})
</script>

<style scoped></style>
