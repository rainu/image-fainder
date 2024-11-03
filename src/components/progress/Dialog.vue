<template>
	<v-dialog v-model="show">
		<v-card density="compact">
			<v-card-title v-if="title">{{ title }}</v-card-title>
			<ProgressBar :current="current" :total="total" :hide-steps="hideSteps" :unit="unit" >
				<slot name="progressbar"></slot>
			</ProgressBar>
			<v-btn @click="$emit('interrupt')" color="error">
				<v-icon icon="mdi-cancel"></v-icon>
				{{$t('progress.interrupt')}}
			</v-btn>
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
	emits: ['interrupt'],
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