<template>
	<DirectoryPicker color="primary" @change="onChange" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { RouteDirectoryAnalyse, RouteDirectorySearch } from "../../router"
import DirectoryPicker from '../../components/DirectoryPicker.vue'
import { useFileStore } from "../../store/file.ts"

export default defineComponent({
	components: { DirectoryPicker },
	methods: {
		onChange(dir: FileSystemDirectoryHandle) {
			this.$vectorDB.countLocal(dir.name).then((c) => {
				if(c > 0) {
					console.log("goto search")
					this.$router.push({ name: RouteDirectorySearch })
				} else {
					console.log("goto analyse")
					this.$router.push({ name: RouteDirectoryAnalyse })
				}
			})
		},
	},
	beforeMount() {
		const dir = useFileStore().mainDirectory
		if(!dir) {
			return
		}

		this.onChange(dir)
	}
})
</script>

<style scoped></style>
