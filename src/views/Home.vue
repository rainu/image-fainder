<template>
	<v-card>
		<v-card-text>
			<DirectoryPicker color="primary" @change="onChange" />
		</v-card-text>
	</v-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DirectoryPicker from '../components/DirectoryPicker.vue'
import { RouteDirectory } from "../router"

export default defineComponent({
	components: { DirectoryPicker },
	methods: {
		onChange(dirHandle: FileSystemDirectoryHandle) {
			this.$router.push({ name: RouteDirectory })
		},
	},
})
</script>

<style scoped></style>
