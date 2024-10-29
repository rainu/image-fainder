<template>
	<div>
		<v-btn @click="showDialog = true" color="error" variant="elevated" block v-show="fileNames.length > 0">
			<v-icon icon="mdi-delete"></v-icon>
			Delete selected
		</v-btn>
		<v-dialog v-model="showDialog">
			<template v-slot:default="{ isActive }">
				<v-card>
					<v-card-title>Confirm deletion</v-card-title>

					<v-card-text v-show="progress.total === 0">
						<v-row dense>
							<v-col cols="12" class="image-container" :style="`column-count: ${columnCount};`">
								<div v-for="name in fileNames" :key="name" @click="onClickImage(name)" class="cursor-pointer">
									<ImageItem
										:base-dir="baseDir"
										:name="name"
										style="margin-bottom: 0.5em"
										:class="selected[name] ? 'image-selected border-lg' : ''"
									/>
								</div>
							</v-col>
						</v-row>
					</v-card-text>

					<ProgressBar :current="progress.current" :total="progress.total" />

					<v-card-actions>
						<v-row>
							<v-col cols="6">
								<v-btn @click="isActive.value = false" block variant="flat" color="secondary">Cancel </v-btn>
							</v-col>
							<v-col cols="6">
								<v-btn @click="deleteSelected" block variant="flat" color="red">
									<v-icon icon="mdi-delete-alert"></v-icon>
									Delete
								</v-btn>
							</v-col>
						</v-row>
					</v-card-actions>
				</v-card>
			</template>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ImageItem from './ImageItem.vue'
import ProgressBar from '../progress/Bar.vue'
import { delayProgress } from "../progress/delayed.ts"

export default defineComponent({
	name: 'ImageDeletion',
	components: { ProgressBar, ImageItem },
	emits: ['onDeleted'],
	props: {
		baseDir: {
			type: Object as () => FileSystemDirectoryHandle,
			required: true,
		},
		fileNames: {
			type: Array as () => string[],
			required: true,
		},
	},
	data() {
		return {
			showDialog: false,
			progress: {
				current: 0,
				total: 0,
			},
			selected: {} as { [key: string]: boolean },
		}
	},
	computed: {
		columnCount() {
			switch (String(this.$vuetify.display.name)) {
				case 'xs':
					return 4
				case 'sm':
					return 6
				case 'md':
					return 8
				case 'lg':
					return 10
				case 'xl':
					return 10
			}
			return 4
		},
		toDelete() {
			return this.fileNames.filter((name) => !this.selected[name])
		},
	},
	methods: {
		onClickImage(name: string) {
			if (this.selected[name]) {
				delete this.selected[name]
			} else {
				this.selected[name] = true
			}
		},
		async deleteDatabaseEntry(fileName: string) {
			const dbEntry = await this.$vectorDB.getByPath(this.baseDir.name + '/' + fileName)
			await this.$vectorDB.delete(dbEntry.id)
		},
		async deleteFile(fileName: string) {
			const file = await this.baseDir.getFileHandle(fileName)
			await file.remove()
		},
		async deleteSelected() {
			this.progress.total = this.toDelete.length
			this.progress.current = 0

			const delayedProgression = delayProgress((i) => (this.progress.current = i))
			try {
				for (let fileName of this.toDelete) {
					try {
						await this.deleteDatabaseEntry(fileName)
					} catch (e) {
						console.warn(e)
					}

					try {
						await this.deleteFile(fileName)
					} catch (e) {
						console.warn(e)
					}

					delayedProgression.add(1)
				}
			} catch (e) {
				console.error(e)
			}

			this.$emit('onDeleted', this.toDelete)
			this.progress.total = 0
			this.showDialog = false
		},
	},
})
</script>

<style scoped>
.image-container {
	column-gap: 0.5em;
}

.image-selected {
	opacity: 0.5;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	transform: scale(1.1);
}
</style>
