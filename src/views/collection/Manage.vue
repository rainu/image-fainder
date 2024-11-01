<template>
	<v-app-bar location="top" elevation="0" density="compact">
		<v-container>
			<v-tabs v-model="tab" align-tabs="center">
				<v-tab value="add">
					<v-icon icon="mdi-image-plus"></v-icon>
					{{ $t('collection.list.add') }}
				</v-tab>
				<v-tab value="list">
					<v-icon icon="mdi-format-list-checkbox"></v-icon>
					{{ $t('collection.list.content') }}
				</v-tab>
			</v-tabs>
		</v-container>
	</v-app-bar>

	<v-tabs-window v-model="tab">
		<v-tabs-window-item value="list">
			<v-list density="compact">
				<v-list-item v-for="item of view" :key="item.id" variant="tonal">
					<template v-slot:prepend>
						<v-list-item-action start>
							<v-checkbox-btn v-model="selected[item.id]"></v-checkbox-btn>
						</v-list-item-action>
					</template>

					<v-list-item-title>
						<a :href="item.parsedUri.rawURI" target="_blank">{{ item.parsedUri.name }}</a>
					</v-list-item-title>
					<v-list-item-subtitle>{{ item.parsedUri.rawURI }}</v-list-item-subtitle>

					<template v-slot:append>
						<v-icon v-if="item.analysed" icon="mdi-eye-check"></v-icon>
						<v-icon v-else icon="mdi-eye-remove"></v-icon>
					</template>
				</v-list-item>
			</v-list>
		</v-tabs-window-item>

		<v-tabs-window-item value="add">
			<v-textarea v-model="newItems" clearable></v-textarea>
		</v-tabs-window-item>
	</v-tabs-window>

	<v-app-bar location="bottom" elevation="0" density="compact">
		<v-container>
			<v-text-field
				v-show="tab === 'list'"
				v-model="filter"
				:label="$t('collection.list.filter')"
				variant="solo"
				hide-details
				append-inner-icon="mdi-magnify"
				clearable
				@click:clear="onFilterChanged"
				@click:append-inner="onFilterChanged"
				@keydown.enter.prevent="onFilterChanged"
			></v-text-field>

			<v-btn v-show="tab === 'add'" color="primary" variant="elevated" block :disabled="!newItems" @click="onAddItems">
				<v-icon icon="mdi-image-plus"></v-icon>
				{{ $t('collection.list.add') }}
			</v-btn>
		</v-container>
	</v-app-bar>

	<v-app-bar v-show="tab === 'list'" location="bottom" elevation="0" density="compact">
		<v-container>
			<v-list-item variant="tonal">
				<template v-slot:prepend>
					<v-list-item-action start>
						<v-checkbox-btn v-model="selectAll"></v-checkbox-btn>
						<v-icon icon="mdi-check-all"></v-icon>
					</v-list-item-action>
				</template>
				<v-list-item-title>
					<v-btn v-show="selectedCount > 0" variant="elevated" color="red" block @click="onDeleteSelected">
						{{ $t('collection.list.delete', { count: selectedCount }) }}
					</v-btn>
				</v-list-item-title>
			</v-list-item>
		</v-container>
	</v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { PersistedVectorEntry, VectorEntryKey } from '../../database/vector.ts'
import { ParsedURI, parseURI, remoteFileURI } from '../../database/uri.ts'

type Item = { id: VectorEntryKey; parsedUri: ParsedURI; analysed: boolean }

export default defineComponent({
	data() {
		return {
			tab: 'list',
			newItems: null as string | null,
			selected: {} as Record<VectorEntryKey, boolean>,
			selectAll: false,
			filter: null as string | null,
			appliedFilter: null as string | null,
			items: [] as Item[],
		}
	},
	computed: {
		collectionName(): string {
			if (Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		},
		view(): Item[] {
			if (!this.appliedFilter) {
				return this.items
			}

			const filter = this.appliedFilter.toLowerCase()
			const result = this.items.filter((i) => i.parsedUri.rawURI.toLowerCase().includes(filter))
			return result
		},
		selectedCount(): number {
			return Object.values(this.selected).filter((v) => v).length
		},
	},
	methods: {
		async collectItems() {
			const result = [] as Item[]
			await this.$vectorDB.iterateRemote(this.collectionName, (e: PersistedVectorEntry): boolean => {
				const parsedUri = parseURI(e.uri)
				if (!parsedUri) {
					return true
				}

				result.push({
					id: e.id,
					parsedUri,
					analysed: e.embedding.length > 0,
				})
				return true
			})
			this.items = result
		},
		onFilterChanged() {
			this.appliedFilter = this.filter
		},
		async onAddItems() {
			if (!this.newItems) {
				return
			}

			const lines = this.newItems.split('\n')
			const validLines = lines.filter((line) => URL.canParse(line))

			for (let line of validLines) {
				const uri = remoteFileURI(this.collectionName, line)
				const exists = await this.$vectorDB.exists(uri)

				if (!exists) {
					const id = await this.$vectorDB.saveRemote({
						collection: this.collectionName,
						uri: uri,
						embedding: Float32Array.from([]),
					})

					const parsedUri = parseURI(uri)
					if (parsedUri) {
						this.items.push({
							id,
							parsedUri,
							analysed: false,
						})
					}
				}
			}

			this.newItems = ''
		},
		async onDeleteSelected() {
			const ids: VectorEntryKey[] = Object.entries(this.selected)
				.filter(([_, value]) => value)
				.map(([key, _]) => key)
				.map((key: string) => Number(key))

			for (let id of ids) {
				await this.$vectorDB.delete(id)
			}
			this.items = this.items.filter((i) => !this.selected[i.id])
			this.selected = {}
		},
	},
	watch: {
		collectionName() {
			this.collectItems()
			this.selected = {}
		},
		items() {
			if (this.items.length === 0) {
				this.tab = 'add'
			}
		},
		selectAll() {
			this.view.forEach((i) => {
				this.selected[i.id] = this.selectAll
			})
		},
	},
	mounted() {
		this.collectItems()
	},
})
</script>

<style scoped>
a {
	text-decoration: none;
	color: inherit;
}
</style>
