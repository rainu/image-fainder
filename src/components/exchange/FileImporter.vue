<template>
	<div>
		<v-btn @click="onClick" v-if="!progress.status" block color="primary">
			<v-icon icon="mdi-file-import"></v-icon>
			Import
		</v-btn>
		<ProgressBar v-else :current="progress.current" :total="progress.total" hide-steps>
			<span>{{ progress.currentItem }}</span>
		</ProgressBar>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { importFile } from './exchange'
import ProgressBar from '../progress/Bar.vue'
import { delayProgress } from "../progress/delayed.ts"

export default defineComponent({
	name: 'FileImporter',
	components: { ProgressBar },
	data() {
		return {
			progress: {
				status: false,
				current: 0,
				currentItem: 0,
				total: 0,
			},
		}
	},
	methods: {
		async onClick() {
			try {
				const [fh] = await window.showOpenFilePicker({ multiple: false })
				this.progress.status = true
				this.progress.currentItem = 0

				const delayedProgression = delayProgress((i) => (this.progress.current = i))
				const delayedProgressionItem = delayProgress((i) => (this.progress.currentItem = i))
				await importFile(fh, this.$vectorDB, (current, total) => {
					this.progress.total = total

					delayedProgression.set(current)
					delayedProgressionItem.add(1)
				})
			} catch (e) {
				console.error(e)
			}
			this.progress.status = false
		},
	},
})
</script>

<style scoped></style>
