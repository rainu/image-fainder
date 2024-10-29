<template>
	<VisionEmbedding :directory="mainDirectory" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from "pinia"
import VisionEmbedding from '../../components/vision/VisionEmbedding.vue'
import { useFileStore } from "../../store/file.ts"

export default defineComponent({
	components: { VisionEmbedding },
	computed: {
		...mapState(useFileStore, ['mainDirectory']),
		mainDirectoryName() {
			return this.mainDirectory ? this.mainDirectory.name : null
		},
	},
})
</script>

<style scoped></style>