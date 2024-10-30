<template>
	<div>
		<v-btn @click="onClick" v-if="!progress.status" block color="primary">
			<v-icon icon="mdi-file-export"></v-icon>
			{{ $t('exchange.export.title') }}
		</v-btn>

		<ProgressBar v-else :current="progress.current" :total="progress.total" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { exportFile } from './exchange'
import ProgressBar from '../progress/Bar.vue'
import { delayProgress } from '../progress/delayed.ts'

export default defineComponent({
	name: 'FileExporter',
	components: { ProgressBar },
	data() {
		return {
			progress: {
				status: false,
				current: 0,
				total: 0,
			},
		}
	},
	methods: {
		async onClick() {
			try {
				const file = await window.showSaveFilePicker()
				this.progress.status = true

				const delayedProgression = delayProgress((i) => (this.progress.current = i))
				await exportFile(file, this.$vectorDB, (current, total) => {
					this.progress.total = total
					delayedProgression.set(current)
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
