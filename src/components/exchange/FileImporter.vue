<template>
	<div>
		<v-btn @click="onClick" block color="primary">
			<v-icon icon="mdi-file-import"></v-icon>
			{{ $t('exchange.import.title') }}
		</v-btn>

		<ProgressDialog
			v-if="progress.status"
			:title="$t('exchange.import.title')"
			:current="progress.current"
			:total="progress.total"
			hide-steps
			@interrupt="onInterrupt"
		>
			<template v-slot:progressbar>
				<span>{{ progress.currentItem }}</span>
			</template>
		</ProgressDialog>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { importFile } from './exchange'
import { delayProgress } from '../progress/delayed.ts'
import ProgressDialog from '../progress/Dialog.vue'

export default defineComponent({
	name: 'FileImporter',
	components: { ProgressDialog },
	data() {
		return {
			progress: {
				status: false,
				current: 0,
				currentItem: 0,
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
				const [fh] = await window.showOpenFilePicker({ multiple: false })
				this.progress.status = true
				this.progress.currentItem = 0

				const delayedProgression = delayProgress((i) => (this.progress.current = i))
				const delayedProgressionItem = delayProgress((i) => (this.progress.currentItem = i))
				await importFile(
					fh,
					this.$vectorDB,
					(current, total) => {
						this.progress.total = total

						delayedProgression.set(current)
						delayedProgressionItem.add(1)
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
