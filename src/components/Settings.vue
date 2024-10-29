<template>
	<v-list v-model:opened="open">
		<v-list-group value="General" fluid>
			<template v-slot:activator="{ props }">
				<v-list-item v-bind="props" prepend-icon="mdi-application-cog-outline"> General </v-list-item>
			</template>
			<v-list-item title="Theme" class="ml-2" prepend-icon="mdi-theme-light-dark" @click="toggleTheme"></v-list-item>
		</v-list-group>
		<v-list-group value="Search" fluid>
			<template v-slot:activator="{ props }">
				<v-list-item v-bind="props" prepend-icon="mdi-image-search-outline"> Search </v-list-item>
			</template>
			<v-list-item class="ml-2">
				<v-select
					label="Items per page"
					v-model="itemsPerPage"
					:items="[25, 50, 100, 150, 200, 500]"
					density="compact"
					prepend-inner-icon="mdi-theme-light-dark"
				></v-select>
			</v-list-item>
			<v-list-item class="ml-2" prepend-inn="mdi-theme-light-dark">
				<div class="text-caption">Similarity threshold: {{ search.similarityThreshold }}</div>
				<v-slider :min="-1" :max="1" :step="0.01" v-model="similarityThreshold" color="primary" density="compact"></v-slider>
			</v-list-item>
			<v-list-item class="ml-2" prepend-inn="mdi-theme-light-dark">
				<v-switch label="Show similarity" v-model="showSimilarity" dense inset color="primary" density="compact"> </v-switch>
			</v-list-item>
		</v-list-group>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { useSettingsStore } from '../store/settings.ts'

export default defineComponent({
	name: 'Settings',
	data() {
		return {
			open: ['General'],
		}
	},
	methods: {
		...mapActions(useSettingsStore, ['toggleTheme', 'setItemsPerPage', 'setSimilarityThreshold', 'setShowSimilarity']),
	},
	computed: {
		...mapState(useSettingsStore, ['search']),
		itemsPerPage: {
			get() {
				return this.search.itemsPerPage
			},
			set(value: number) {
				this.setItemsPerPage(value)
			},
		},
		similarityThreshold: {
			get() {
				return this.search.similarityThreshold
			},
			set(value: number) {
				this.setSimilarityThreshold(value)
			},
		},
		showSimilarity: {
			get() {
				return this.search.showSimilarity
			},
			set(value: boolean) {
				this.setShowSimilarity(value)
			},
		},
	},
})
</script>

<style scoped></style>
