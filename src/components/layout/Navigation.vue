<template>
	<v-list :opened="open" open-strategy="multiple">
		<!-- Directory (only if supported) -->
		<template v-if="features.local">
			<v-list-group v-if="mainDirectory" value="local">
				<template v-slot:activator="{ props }">
					<v-list-item v-bind="props" :title="$t('file.title')" prepend-icon="mdi-folder-open-outline"></v-list-item>
				</template>

				<v-list-item
					:to="{ name: RouteDirectoryAnalyse }"
					:title="$t('vision.analyse.title')"
					prepend-icon="mdi-folder-eye-outline"
				></v-list-item>
				<v-list-item
					:to="{ name: RouteDirectorySearch }"
					:title="$t('search.title')"
					prepend-icon="mdi-folder-search-outline"
				></v-list-item>
			</v-list-group>
			<template v-else>
				<v-list-item :to="{ name: RouteDirectory }" :title="$t('file.title')" prepend-icon="mdi-folder-open-outline"></v-list-item>
			</template>
		</template>

		<!-- Collection -->
		<v-list-group v-if="collectionName" value="remote">
			<template v-slot:activator="{ props }">
				<v-list-item v-bind="props" :title="$t('collection.title')" prepend-icon="mdi-collage" active></v-list-item>
			</template>

			<v-list-item
				:to="{ name: RouteCollectionList, params: { collection: collectionName } }"
				:title="$t('collection.list.title')"
				prepend-icon="mdi-format-list-group"
			></v-list-item>
			<v-list-item
				:to="{ name: RouteCollectionAnalyse, params: { collection: collectionName } }"
				:title="$t('vision.analyse.title')"
				prepend-icon="mdi-archive-eye-outline"
			></v-list-item>
			<v-list-item
				:to="{ name: RouteCollectionSearch, params: { collection: collectionName } }"
				:title="$t('search.title')"
				prepend-icon="mdi-image-search-outline"
			></v-list-item>
		</v-list-group>
		<template v-else>
			<v-list-item :to="{ name: RouteCollection }" :title="$t('collection.title')" prepend-icon="mdi-collage"></v-list-item>
		</template>

		<v-divider />

		<!-- Exchange -->
		<v-list-item
			:to="{ name: RouteImport }"
			:title="$t('exchange.import.title')"
			prepend-icon="mdi-import"
		></v-list-item>
		<v-list-item
			:to="{ name: RouteExport }"
			:title="$t('exchange.export.title')"
			prepend-icon="mdi-export"
		></v-list-item>

		<v-divider />

		<!-- Other -->
		<v-list-item
			:to="{ name: RouteHelp }"
			:title="$t('help.title')"
			prepend-icon="mdi-help-circle-outline"
		></v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import {
	RouteCollection,
	RouteCollectionAnalyse,
	RouteCollectionManage,
	RouteCollectionSearch,
	RouteDirectory,
	RouteDirectoryAnalyse,
	RouteDirectorySearch,
	RouteExport,
	RouteHome,
	RouteImport,
	RouteHelp
} from "../../router"
import { mapState } from "pinia"
import { useFileStore } from "../../store/file.ts"
import { isLocalSupported } from "../../support.ts"

export default defineComponent({
	name: "Navigation",
	data() {
		return {
			open: ['local', 'remote'],
			features: {
				local: isLocalSupported(),
			},
			RouteHome,
			RouteHelp,
			RouteDirectory,
			RouteDirectoryAnalyse,
			RouteDirectorySearch,
			RouteCollection,
			RouteCollectionAnalyse,
			RouteCollectionList: RouteCollectionManage,
			RouteCollectionSearch,
			RouteImport,
			RouteExport
		}
	},
	computed: {
		...mapState(useFileStore, ['mainDirectory']),
		collectionName(): string | null {
			if (!this.$route.params.collection) {
				return null
			}

			if (Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		}
	}
})
</script>

<style scoped>

</style>