<template>
	<v-row dense>
		<v-col cols="4">
			<v-btn v-if="author && author.name" :href="author.url" target="_blank" variant="plain">
				<v-icon icon="mdi-account-wrench"></v-icon>
				{{ author.name }}
			</v-btn>
		</v-col>
		<v-col cols="4" class="d-flex justify-center">
			<v-btn v-if="bugs && bugs.url" :href="bugs.url" target="_blank" icon="mdi-bug" size="x-small" > </v-btn>
		</v-col>
		<v-col cols="4">
			<v-btn :href="sourceUrl" target="_blank" variant="text">
				<v-icon icon="mdi-tag-outline"></v-icon>
				{{ version }}
			</v-btn>
		</v-col>
	</v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { author, bugs, homepage, version } from '../../../package.json'

export default defineComponent({
	name: 'Footer',
	data() {
		return {
			author,
			version,
			commitHash: import.meta.env.VITE_COMMIT_HASH,
			homepage,
			bugs,
		}
	},
	computed: {
		shortHash(){
			return this.commitHash.slice(0, 7)
		},
		sourceUrl() {
			return `${this.homepage}/tree/v${this.version}`
		}
	}
})
</script>

<style scoped></style>
