<template>
	<v-list v-model:opened="open">
		<v-list-group value="General" fluid>
			<template v-slot:activator="{ props }">
				<v-list-item v-bind="props" prepend-icon="mdi-application-cog-outline">
					{{ $t('settings.general.title') }}
				</v-list-item>
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
				<v-list-item v-bind="props" prepend-icon="mdi-image-search-outline">
					{{ $t('settings.search.title') }}
				</v-list-item>
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
				<div class="text-caption">
					{{ $t('settings.search.similarity.threshold') }}: {{ search.similarityThreshold }}
				</div>
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
				<v-switch
					:label="$t('settings.search.similarity.show')"
					v-model="showSimilarity"
					dense
					inset
					color="primary"
					density="compact"
				>
				</v-switch>
			</v-list-item>
		</v-list-group>

		<v-list-group value="Model" fluid>
			<template v-slot:activator="{ props }">
				<v-list-item v-bind="props" prepend-icon="mdi-head-cog-outline">
					{{ $t('settings.model.title') }}
				</v-list-item>
			</template>

			<v-list-item class="ml-2">
				<v-text-field
					v-model="model.vision"
					:label="$t('settings.model.vision')"
					density="compact"
					hide-details
				></v-text-field>
			</v-list-item>
			<v-list-item class="ml-2">
				<v-text-field
					v-model="model.text"
					:label="$t('settings.model.text')"
					density="compact"
					hide-details
				></v-text-field>
			</v-list-item>
			<v-list-item class="ml-2">
				<v-text-field
					v-model="model.processor"
					:label="$t('settings.model.processor')"
					density="compact"
					hide-details
				></v-text-field>
			</v-list-item>
			<v-list-item class="ml-2">
				<v-text-field
					v-model="model.tokenizer"
					:label="$t('settings.model.tokenizer')"
					density="compact"
					hide-details
				></v-text-field>
			</v-list-item>
			<v-list-item class="ml-2">
				<v-btn color="primary" block @click="applyModelValues">{{ $t('settings.model.apply') }}</v-btn>
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
			model: {
				vision: '',
				text: '',
				tokenizer: '',
				processor: '',
			},
		}
	},
	methods: {
		...mapActions(useSettingsStore, [
			'toggleTheme',
			'setLocale',
			'setItemsPerPage',
			'setSimilarityThreshold',
			'setShowSimilarity',
			'setModelVision',
			'setModelText',
			'setModelProcessor',
			'setModelTokenizer',
		]),
		setModelValues(value: {vision: string, text: string, processor: string, tokenizer: string}) {
			this.model.vision = value.vision
			this.model.text = value.text
			this.model.processor = value.processor
			this.model.tokenizer = value.tokenizer
		},
		applyModelValues(){
			this.setModelVision(this.model.vision)
			this.setModelText(this.model.text)
			this.setModelProcessor(this.model.processor)
			this.setModelTokenizer(this.model.tokenizer)

			//reload website
			window.location.reload()
		}
	},
	computed: {
		...mapState(useSettingsStore, ['search', 'locale']),
		...mapState(useSettingsStore, { persistedModel: 'model' }),
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
	watch: {
		persistedModel: {
			deep: true,
			handler(value) {
				this.setModelValues(value)
			},
		},
	},
	mounted() {
		this.setModelValues(this.persistedModel)
	},
})
</script>

<style scoped></style>
