<template>
	<v-app :theme="theme">
		<HeadBar @on-left="drawer.left = !drawer.left" @on-right="drawer.right = !drawer.right" />

		<v-navigation-drawer v-model="drawer.left" location="left">
			<Navigation />
		</v-navigation-drawer>
		<v-navigation-drawer v-model="drawer.right" location="right">
			<Settings />
		</v-navigation-drawer>

		<v-main>
			<v-container style="height: 100%">
				<RouterView />
			</v-container>
		</v-main>
	</v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useSettingsStore } from './store/settings.ts'
import Settings from './components/Settings.vue'
import Navigation from './components/layout/Navigation.vue'
import HeadBar from "./components/layout/HeadBar.vue"

export default defineComponent({
	components: { HeadBar, Navigation, Settings},
	data() {
		return {
			open: ['local', 'remote'],
			drawer: {
				left: false,
				right: false,
			},
		}
	},
	computed: {
		...mapState(useSettingsStore, ['theme', 'locale']),
	},
	methods: {
		applyLocale() {
			this.$i18n.locale = this.locale
		},
	},
	watch: {
		locale() {
			this.applyLocale()
		},
	},
	mounted() {
		this.applyLocale()
	},
})
</script>

<style scoped></style>
