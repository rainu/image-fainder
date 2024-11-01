<template>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DirectoryPicker from '../components/DirectoryPicker.vue'
import { RouteCollection, RouteDirectory, RouteHelp } from "../router"
import { isLocalSupported } from "../support.ts"

export default defineComponent({
	components: { DirectoryPicker },
	beforeMount() {
		Promise.all([
			this.$vectorDB.getLocalDirectories(),
			this.$vectorDB.getRemoteCollections(),
		]).then(([directories, collections]) => {
			if(isLocalSupported()) {
				if(directories.length === 0 && collections.length > 0) {
					this.$router.push({ name: RouteCollection })
					return
				}
				if(directories.length > 0) {
					this.$router.push({ name: RouteDirectory })
					return
				}
			} else {
				if(collections.length > 0) {
					this.$router.push({ name: RouteCollection })
					return
				}
			}

			this.$router.push({ name: RouteHelp })
		})
	},
})
</script>

<style scoped></style>
