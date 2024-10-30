<template>
	<v-list v-model:opened="open">
		<v-list-group value="General" fluid>
			<template v-slot:activator="{ props }">
				<v-list-item v-bind="props" prepend-icon="mdi-application-cog-outline"> {{ $t('settings.general.title') }} </v-list-item>
			</template>
			<v-list-item
				:title="$t('settings.general.theme')"
				class="ml-2"
				prepend-icon="mdi-theme-light-dark"
				@click="toggleTheme"
			></v-list-item>
			<v-list-item class="ml-2">
				<v-select
					:label="$t('settings.general.language')"
					v-model="currentLocale"
					:items="languages"
					density="compact"
					prepend-inner-icon="mdi-translate"
				></v-select>
			</v-list-item>
		</v-list-group>
		<v-list-group value="Search" fluid>
			<template v-slot:activator="{ props }">
				<v-list-item v-bind="props" prepend-icon="mdi-image-search-outline"> {{ $t('settings.search.title') }} </v-list-item>
			</template>
			<v-list-item class="ml-2">
				<v-select
					:label="$t('settings.search.ipp')"
					v-model="itemsPerPage"
					:items="[25, 50, 100, 150, 200, 500]"
					density="compact"
					prepend-inner-icon="mdi-theme-light-dark"
				></v-select>
			</v-list-item>
			<v-list-item class="ml-2" prepend-inn="mdi-theme-light-dark">
				<div class="text-caption">{{ $t('settings.search.similarity.threshold') }}: {{ search.similarityThreshold }}</div>
				<v-slider
					:min="-1"
					:max="1"
					:step="0.01"
					v-model="similarityThreshold"
					color="primary"
					density="compact"
				></v-slider>
			</v-list-item>
			<v-list-item class="ml-2" prepend-inn="mdi-theme-light-dark">
				<v-switch :label="$t('settings.search.similarity.show')" v-model="showSimilarity" dense inset color="primary" density="compact">
				</v-switch>
			</v-list-item>
		</v-list-group>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { useSettingsStore } from '../store/settings.ts'
import i18n from '../i18n/index.ts'

export default defineComponent({
	name: 'Settings',
	data() {
		return {
			languages: i18n.locales.sort(),
			open: ['General'],
		}
	},
	methods: {
		...mapActions(useSettingsStore, [
			'toggleTheme',
			'setLocale',
			'setItemsPerPage',
			'setSimilarityThreshold',
			'setShowSimilarity',
		]),
	},
	computed: {
		...mapState(useSettingsStore, ['search', 'locale']),
		currentLocale: {
			get() {
				return this.locale
			},
			set(value: string) {
				this.setLocale(value)
			},
		},
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
