<template>
	<v-btn @click="onClick" :variant="variant" :color="color" block>
		<v-icon icon="mdi-folder-outline"></v-icon>
		{{ btnLabel }}
	</v-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from "pinia"
import { useFileStore } from '../store/file.ts'

export default defineComponent({
	name: 'DirectoryPicker',
	emits: ['change'],
	props: {
		variant: {
			type: String,
			default: 'elevated',
		},
		color: {
			type: String,
			default: null,
		}
	},
	computed: {
		...mapState(useFileStore, ['mainDirectory']),
		btnLabel() {
			if (this.mainDirectory?.name) {
				return this.mainDirectory.name
			} else {
				return 'Choose Directory'
			}
		},
	},
	methods: {
		...mapActions(useFileStore, ['setMainDirectory']),
		async onClick() {
			const dirHandle = await window.showDirectoryPicker()
			this.setMainDirectory(dirHandle)
			this.$emit('change', dirHandle)
		},
	},
})
</script>

<style scoped></style>
