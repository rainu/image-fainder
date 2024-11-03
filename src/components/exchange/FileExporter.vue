<template>
	<div>
		<v-btn @click="onClick" block color="primary">
			<v-icon icon="mdi-file-export"></v-icon>
			{{ $t('exchange.export.title') }}
		</v-btn>

		<ProgressDialog
			v-if="progress.status"
			:title="$t('exchange.export.title')"
			:current="progress.current"
			:total="progress.total"
			:unit="$t('progress.duration.unit.image')"
			@interrupt="onInterrupt"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { exportFile } from './exchange'
import { delayProgress } from '../progress/delayed.ts'
import ProgressDialog from '../progress/Dialog.vue'

export default defineComponent({
	name: 'FileExporter',
	components: { ProgressDialog },
	data() {
		return {
			progress: {
				status: false,
				current: 0,
				total: 0,
				interrupted: false,
			},
		}
	},
	methods: {
		onInterrupt() {
			this.progress.interrupted = true
		},
		async onClick() {
			try {
				const file = await window.showSaveFilePicker()
				this.progress.status = true

				const delayedProgression = delayProgress((i) => (this.progress.current = i))
				await exportFile(
					file,
					this.$vectorDB,
					(current, total) => {
						this.progress.total = total
						delayedProgression.set(current)
					},
					() => this.progress.interrupted,
				)
			} catch (e) {
				console.error(e)
			}

			this.progress.status = false
			this.progress.interrupted = false
		},
	},
})
</script>

<style scoped></style>
