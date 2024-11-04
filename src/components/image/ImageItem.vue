<template>
	<div :class="class">
		<v-card v-if="url" density="compact">
			<v-img :src="url" />
			<slot></slot>
		</v-card>
		<v-icon v-else size="256" icon="mdi-image-off"></v-icon>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ParsedURI } from "../../database/uri.ts"

export interface Image {
	uri: ParsedURI
	similarity: number
}

export default defineComponent({
	name: 'ImageItem',
	props: {
		baseDir: {
			type: FileSystemDirectoryHandle,
			default: null,
		},
		image: {
			type: Object as () => Image,
			required: true,
		},
		class: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			url: '',
		}
	},
	watch: {
		image: {
			deep: true,
			immediate: true,
			async handler() {
				if(this.image.uri.type === 'remoteFile') {
					this.url = this.image.uri.rawURI
					return
				}

				if(!this.baseDir) {
					return
				}

				let parentDirectory = this.baseDir
				let name = this.image.uri.name
				const parents = this.image.uri.name.split('/')
				if(parents.length > 1) {
					name = parents.pop() || ''
					for (let parent of parents) {
						try {
							parentDirectory = await parentDirectory.getDirectoryHandle(parent)
						} catch (e: Error) {
							if (e.name !== 'NotFoundError') {
								console.error(e)
							}
							return
						}
					}
				}

				try {
					const file = await parentDirectory.getFileHandle(name)
					this.url = URL.createObjectURL(await file.getFile())
				} catch (e: Error) {
					if (e.name !== 'NotFoundError') {
						console.error(e)
					}
				}
			},
		},
	},
})
</script>

<style scoped></style>
