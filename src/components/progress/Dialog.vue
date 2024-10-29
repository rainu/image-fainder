<template>
	<v-dialog v-model="show">
		<v-card density="compact">
			<v-card-title v-if="title">{{ title }}</v-card-title>
			<ProgressBar :current="current" :total="total" :hide-steps="hideSteps" :unit="unit" />
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ProgressBar from './Bar.vue'

export default defineComponent({
	name: 'ProgressDialog',
	components: { ProgressBar },
	props: {
		title: {
			type: String,
			default: '',
		},
		current: {
			type: Number,
			required: false,
		},
		total: {
			type: Number,
			required: false,
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
		return {}
	},
	computed: {
		show() {
			return this.total > 0
		},
	},
})
</script>

<style scoped></style>