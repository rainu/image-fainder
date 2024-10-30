<template>
	<v-container>
		<v-app-bar location="top" elevation="0" density="compact">
			<v-container>
				<v-pagination v-model="page" :length="pageCount"></v-pagination>
			</v-container>
		</v-app-bar>

		<v-row dense>
			<v-col cols="12" class="image-container" :style="`column-count: ${columnCount};`">
				<div v-for="image in displayItems" :key="image.uri.rawURI" @click="onClickImage(image.uri.rawURI)" class="cursor-pointer">
					<ImageItem
						:base-dir="baseDir"
						:image="image"
						style="margin-bottom: 1em"
						:class="selected[image.uri.rawURI] ? 'image-selected border-lg' : ''"
					>
						<span v-if="search.showSimilarity" class="text-caption">
							{{ image.similarity }}
						</span>
					</ImageItem>
				</div>
			</v-col>
		</v-row>

		<v-app-bar location="bottom" elevation="0" density="compact">
			<v-container>
				<v-pagination v-model="page" :length="pageCount"></v-pagination>
			</v-container>
		</v-app-bar>

		<v-app-bar location="bottom" elevation="0" v-if="selectedImages.length > 0" density="compact">
			<v-container>
				<v-row>
					<v-col cols="6" sm="8"></v-col>
					<v-col cols="6" sm="4">
						<ImageDeletion :base-dir="baseDir" :images="selectedImages" @onDeleted="onDeleted" />
					</v-col>
				</v-row>
			</v-container>
		</v-app-bar>
	</v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ImageItem, { Image } from './ImageItem.vue'
import { ImageResult } from '../text/TextEmbedding.vue'
import ImageDeletion from './ImageDeletion.vue'
import { mapState } from "pinia"
import { useSettingsStore } from "../../store/settings.ts"
import { URI } from "../../database/uri.ts"

export default defineComponent({
	name: 'ImagePaging',
	components: { ImageDeletion, ImageItem },
	props: {
		baseDir: {
			type: Object as () => FileSystemDirectoryHandle,
			required: true,
		},
		images: {
			type: Array as () => ImageResult[],
			default: () => [],
		},
		limit: {
			type: Number,
			default: null,
		},
	},
	data() {
		return {
			page: 1,
			selected: {} as { [key: URI]: boolean },
			deleted: {} as { [key: URI]: boolean },
		}
	},
	computed: {
		...mapState(useSettingsStore, ['search']),
		limitToUse() {
			return this.limit || this.search.itemsPerPage
		},
		columnCount() {
			switch (String(this.$vuetify.display.name)) {
				case 'xs':
					return 1
				case 'sm':
					return 2
				case 'md':
					return 3
				case 'lg':
					return 4
				case 'xl':
					return 4
			}
			return 1
		},
		view() {
			return this.images.filter((i) => !this.deleted[i.uri.rawURI])
		},
		pageCount() {
			return Math.ceil(this.view.length / this.limitToUse)
		},
		start() {
			return (this.page - 1) * this.limitToUse
		},
		end() {
			return Math.min(this.start + this.limitToUse, this.view.length)
		},
		displayItems(): Image[] {
			if (!this.baseDir) return []

			const imageItems = [] as Image[]
			for (let result of this.view.slice(this.start, this.end)) {
				if(result.uri.directory === this.baseDir.name) {
					imageItems.push(result)
				}
			}
			return imageItems
		},
		selectedImages(): Image[] {
			return this.images.filter((i) => this.selected[i.uri.rawURI])
		},
	},
	methods: {
		onClickImage(uri: URI) {
			if (this.selected[uri]) {
				delete this.selected[uri]
			} else {
				this.selected[uri] = true
			}
		},
		onDeleted(deleted: Image[]) {
			for (let deletedImage of deleted) {
				this.deleted[deletedImage.uri.rawURI] = true
				delete this.selected[deletedImage.uri.rawURI]
			}
		},
	},
	watch: {
		baseDir: {
			immediate: true,
			handler() {
				this.page = 1
			},
		},
		images() {
			this.page = 1
		}
	},
})
</script>

<style scoped>
.image-container {
	column-gap: 1em;
}

.image-selected {
	filter: grayscale(100%);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
