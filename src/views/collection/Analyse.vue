<template>
	<VisionEmbedding :collection="collectionName" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import VisionEmbedding from "../../components/vision/VisionEmbedding.vue"

export default defineComponent({
	components: { VisionEmbedding },
	computed: {
		collectionName(): string {
			if(Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		},
	},
})
</script>

<style scoped></style>
