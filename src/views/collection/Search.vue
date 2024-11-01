<template>
	<v-app-bar location="bottom" elevation="0" density="compact">
		<TextEmbedding :collection="collectionName" @search-result="onSearchResult" />
	</v-app-bar>

	<AutoTokenizerLoader modelName="jinaai/jina-clip-v1" />
	<ClipTextModelLoader modelName="jinaai/jina-clip-v1" />

	<template v-if="collectionName && images && images.length > 0">
		<ImagePaging :images="images" />
	</template>
	<template v-else>
		<v-container class="d-flex justify-center align-center">
			<span
				v-if="totalImages !== 0"
				v-html="$t('vision.analysed.summary', { total: totalImages, collection: collectionName })"
			>
			</span>
		</v-container>
	</template>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ImagePaging from '../../components/image/ImagePaging.vue'
import TextEmbedding, { ImageResult } from '../../components/text/TextEmbedding.vue'
import AutoTokenizerLoader from '../../components/text/AutoTokenizerLoader.vue'
import ClipTextModelLoader from '../../components/text/ClipTextModelLoader.vue'

export default defineComponent({
	components: { ClipTextModelLoader, AutoTokenizerLoader, TextEmbedding, ImagePaging },
	data() {
		return {
			images: [] as ImageResult[],
			totalImages: 0,
		}
	},
	computed: {
		collectionName(): string {
			if(Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		},
	},
	methods: {
		async onSearchResult(results: ImageResult[]) {
			this.images = results
		},
		updateTotalImageCount(collection: string | undefined) {
			if (collection) {
				this.$vectorDB.countRemote(collection).then((c) => (this.totalImages = c))
			} else {
				this.totalImages = 0
			}
		},
	},
	watch: {
		collectionName(collection: string | undefined) {
			this.updateTotalImageCount(collection)
		},
	},
	mounted() {
		this.updateTotalImageCount(this.collectionName)
	},
})
</script>

<style scoped></style>
