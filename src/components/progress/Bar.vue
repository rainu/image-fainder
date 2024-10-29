<template>
	<v-progress-linear v-if="!total || total > 0" v-model="current" :max="total" height="36" color="primary">
		<strong>
			<template v-if="!hideSteps">
				<span>{{ current }}</span>
				<span>&nbsp/&nbsp;</span>
				<span>{{ total }}</span>
			</template>

			<slot></slot>

			<span>&nbsp;{{ Math.ceil((current * 100) / total) }}%</span>
			<span v-if="eta">&nbsp;- {{ eta }}</span>
			<span v-if="avgDuration" v-show="unit"> &nbsp;- {{ avgDuration.toFixed(2) }}ms per {{ unit }} </span>
		</strong>
	</v-progress-linear>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	name: 'ProgressBar',
	props: {
		current: {
			type: Number,
			default: 0,
		},
		total: {
			type: Number,
			default: 0,
		},
		hideSteps: {
			type: Boolean,
			default: false,
		},
		unit: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			t: new Date().getTime(),
			avgDuration: 0,
		}
	},
	computed: {
		eta() {
			if (!this.avgDuration) return null

			const milliseconds = (this.total - this.current) * this.avgDuration
			const seconds = Math.floor((milliseconds / 1000) % 60)
			const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
			const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24)

			if (isNaN(seconds) || isNaN(minutes) || isNaN(hours)) {
				return null
			}

			const pad = (num: number) => num.toString().padStart(2, '0')

			return `${pad(hours)}h:${pad(minutes)}m:${pad(seconds)}s`
		},
	},
	watch: {
		current(nv, ov) {
			if (nv === ov) return

			const duration = new Date().getTime() - this.t
			this.t = new Date().getTime()

			if (this.avgDuration) {
				this.avgDuration = (this.avgDuration * ov + duration) / nv
			} else {
				this.avgDuration = duration / (nv - ov)
			}
		},
	},
})
</script>

<style scoped></style>
