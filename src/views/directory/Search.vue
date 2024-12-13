<template>
	<v-app-bar location="bottom" elevation="0" density="compact">
		<TextEmbedding :directory="mainDirectoryName" @search-result="onSearchResult" />
	</v-app-bar>

	<AutoTokenizerLoader :modelName="model.tokenizer" />
	<ClipTextModelLoader :modelName="model.text" />

	<template v-if="mainDirectory && images && images.length > 0">
		<ImagePaging :base-dir="mainDirectory" :images="images" />
	</template>
	<template v-else>
		<v-container class="d-flex justify-center align-center">
			<span
				v-if="totalImages !== 0"
				v-html="$t('vision.analysed.summary', { total: totalImages, collection: mainDirectoryName })"
			>
			</span>
		</v-container>
	</template>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useFileStore } from '../../store/file.ts'
import ImagePaging from '../../components/image/ImagePaging.vue'
import TextEmbedding, { ImageResult } from '../../components/text/TextEmbedding.vue'
import AutoTokenizerLoader from '../../components/text/AutoTokenizerLoader.vue'
import ClipTextModelLoader from '../../components/text/ClipTextModelLoader.vue'
import { useSettingsStore } from '../../store/settings.ts'

export default defineComponent({
	components: { ClipTextModelLoader, AutoTokenizerLoader, TextEmbedding, ImagePaging },
	data() {
		return {
			images: [] as ImageResult[],
			totalImages: 0,
		}
	},
	computed: {
		...mapState(useFileStore, ['mainDirectory']),
		...mapState(useSettingsStore, ['model']),
		mainDirectoryName() {
			return this.mainDirectory ? this.mainDirectory.name : undefined
		},
	},
	methods: {
		async onSearchResult(results: ImageResult[]) {
			this.images = results
		},
		updateTotalImageCount(dirName: string | undefined) {
			if (dirName) {
				this.$vectorDB.countLocal(dirName).then((c) => (this.totalImages = c))
			} else {
				this.totalImages = 0
			}
		},
	},
	watch: {
		mainDirectoryName(newName: string | undefined) {
			this.updateTotalImageCount(newName)
		},
	},
	mounted() {
		this.updateTotalImageCount(this.mainDirectoryName)
	},
})
</script>

<style scoped></style>
