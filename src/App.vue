<template>
	<v-app :theme="theme">
		<v-app-bar>
			<v-app-bar-nav-icon variant="text" @click.stop="drawer.left = !drawer.left" />
			<v-spacer />
			<strong v-if="mainDirectory">
				<DirectoryPicker variant="outlined" />
			</strong>
			<v-spacer />

			<template v-slot:append>
				<DeviceIndicator />
				<v-btn icon="mdi-cog" @click.stop="drawer.right = !drawer.right"></v-btn>
			</template>
		</v-app-bar>
		<v-navigation-drawer v-model="drawer.left" location="left">
			<v-list>
				<template v-if="mainDirectory">
					<v-list-item
						:to="{ name: RouteDirectoryAnalyse }"
						:title="$t('vision.analyse.title')"
						prepend-icon="mdi-folder-search-outline"
					></v-list-item>
					<v-list-item
						:to="{ name: RouteDirectorySearch }"
						:title="$t('search.title')"
						prepend-icon="mdi-image-search-outline"
					></v-list-item>
				</template>
				<template v-else>
					<v-list-item :to="{ name: RouteHome }" :title="$t('landingpage.title')" prepend-icon="mdi-home"></v-list-item>
				</template>
				<v-list-item :to="{ name: RouteImport }" :title="$t('exchange.import.title')" prepend-icon="mdi-import"></v-list-item>
				<v-list-item :to="{ name: RouteExport }" :title="$t('exchange.export.title')" prepend-icon="mdi-export"></v-list-item>
			</v-list>
		</v-navigation-drawer>
		<v-navigation-drawer v-model="drawer.right" location="right">
			<Settings />
		</v-navigation-drawer>

		<v-main>
			<v-container>
				<RouterView />
			</v-container>
		</v-main>
	</v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useFileStore } from './store/file.ts'
import { useSettingsStore } from './store/settings.ts'
import { RouteDirectoryAnalyse, RouteDirectorySearch, RouteExport, RouteHome, RouteImport } from './router'
import DirectoryPicker from './components/DirectoryPicker.vue'
import Settings from './components/Settings.vue'
import DeviceIndicator from './components/DeviceIndicator.vue'

export default defineComponent({
	components: { DeviceIndicator, Settings, DirectoryPicker },
	data() {
		return {
			drawer: {
				left: false,
				right: false,
			},
			RouteHome,
			RouteDirectoryAnalyse,
			RouteDirectorySearch,
			RouteImport,
			RouteExport,
		}
	},
	computed: {
		...mapState(useSettingsStore, ['theme', 'locale']),
		...mapState(useFileStore, ['mainDirectory']),
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
