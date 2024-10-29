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
						title="Analyse"
						prepend-icon="mdi-folder-search-outline"
					></v-list-item>
					<v-list-item
						:to="{ name: RouteDirectorySearch }"
						title="Search"
						prepend-icon="mdi-image-search-outline"
					></v-list-item>
				</template>
				<v-list-item :to="{ name: RouteImport }" title="Import" prepend-icon="mdi-import"></v-list-item>
				<v-list-item :to="{ name: RouteExport }" title="Export" prepend-icon="mdi-export"></v-list-item>
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
import { RouteDirectoryAnalyse, RouteDirectorySearch, RouteExport, RouteImport } from './router'
import DirectoryPicker from './components/DirectoryPicker.vue'
import Settings from "./components/Settings.vue"
import DeviceIndicator from "./components/DeviceIndicator.vue"

export default defineComponent({
	components: { DeviceIndicator, Settings, DirectoryPicker },
	data() {
		return {
			drawer: {
				left: false,
				right: false,
			},
			RouteDirectoryAnalyse,
			RouteDirectorySearch,
			RouteImport,
			RouteExport,
		}
	},
	computed: {
		...mapState(useSettingsStore, ['theme']),
		...mapState(useFileStore, ['mainDirectory']),
	},
})
</script>

<style scoped></style>
