<template>
	<v-app-bar location="top" elevation="0" density="compact">
		<v-container>
			<v-pagination v-model="page" :length="pageCount"></v-pagination>
		</v-container>
	</v-app-bar>

	<v-list density="compact">
		<v-list-item v-for="item of view.items" :key="item.id" variant="tonal">
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

	<v-app-bar location="bottom" elevation="0" density="compact">
		<v-container>
			<v-pagination v-model="page" :length="pageCount"></v-pagination>
		</v-container>
	</v-app-bar>

	<v-app-bar location="bottom" elevation="0" density="compact">
		<v-container>
			<v-text-field
				v-model="filter.value"
				:label="$t('collection.manage.filter')"
				variant="solo"
				hide-details
				append-inner-icon="mdi-magnify"
				clearable
				@click:clear="onFilterChanged"
				@click:append-inner="onFilterChanged"
				@keydown.enter.prevent="onFilterChanged"
			></v-text-field>
		</v-container>
	</v-app-bar>

	<v-app-bar location="bottom" elevation="0" density="compact">
		<v-container>
			<v-list-item variant="tonal">
				<template v-slot:prepend>
					<v-list-item-action start>
						<v-btn icon @click="onSelect(true)">
							<v-icon icon="mdi-check-all"></v-icon>
						</v-btn>
						<v-btn icon @click="onSelect(false)">
							<v-icon icon="mdi-checkbox-blank-off-outline"></v-icon>
						</v-btn>
					</v-list-item-action>
				</template>
				<v-list-item-title>
					<v-btn v-show="selectedCount > 0" variant="elevated" color="red" block @click="onDeleteSelected">
						{{ $t('collection.manage.delete', { count: selectedCount }) }}
					</v-btn>
				</v-list-item-title>
			</v-list-item>
		</v-container>
	</v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { PersistedVectorEntry, VectorEntryKey } from '../../../database/vector.ts'
import { ParsedURI, parseURI } from '../../../database/uri.ts'

type Item = { id: VectorEntryKey; parsedUri: ParsedURI; analysed: boolean }

export default defineComponent({
	data() {
		return {
			totalCount: 0,
			view: {
				count: 0,
				items: [] as Item[],
			},
			selected: {} as Record<VectorEntryKey, boolean>,
			selectAll: false,
			filter: {
				value: '',
				applied: null as string | null,
			},
			page: 1,
			limit: 100,
		}
	},
	computed: {
		collectionName(): string {
			if (Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		},
		selectedCount() {
			return Object.values(this.selected).filter((v) => v).length
		},
		filterLowercase() {
			return this.filter.applied?.toLowerCase()
		},
		pageCount() {
			return Math.ceil(this.view.count / this.limit)
		},
	},
	methods: {
		isIncluded(e: PersistedVectorEntry): boolean {
			if(!this.filterLowercase) {
				return true
			}

			const parsedUri = parseURI(e.uri)
			if (!parsedUri) {
				return false
			}
			return parsedUri.rawURI.toLowerCase().includes(this.filterLowercase)
		},
		async collectInformation() {
			this.totalCount = await this.$vectorDB.countRemote(this.collectionName)
			this.page = 1

			if (this.filter.applied) {
				let count = 0
				await this.$vectorDB.iterateRemote(this.collectionName, (e: PersistedVectorEntry): boolean => {
					if (this.isIncluded(e)) {
						count++
					}

					return true
				})
				this.view.count = count
			} else {
				this.view.count = this.totalCount
			}
		},
		async collectView() {
			const items: Item[] = []
			const offset = (this.page - 1) * this.limit
			let count = 0
			await this.$vectorDB.iterateRemote(this.collectionName, (e: PersistedVectorEntry): boolean => {
				if (this.isIncluded(e)) {
					if (count >= offset) {
						const parsedUri = parseURI(e.uri)
						if (parsedUri) {
							items.push({ id: e.id, parsedUri, analysed: e.embedding.length > 0 })
						}
					}
					count++
				}

				return items.length < this.limit
			})
			this.view.items = items
		},
		onFilterChanged(){
			this.filter.applied = this.filter.value
		},
		onSelect(value: boolean){
			this.view.items.forEach((i) => {
				this.selected[i.id] = value
			})
		},
		async onDeleteSelected() {
			const ids: VectorEntryKey[] = Object.entries(this.selected)
				.filter(([_, value]) => value)
				.map(([key, _]) => key)
				.map((key: string) => Number(key))

			for (let id of ids) {
				await this.$vectorDB.delete(id)
			}

			this.selected = {}
			await this.collectView()
			await this.collectInformation()
		}
	},
	watch: {
		'filter.applied'() {
			this.collectInformation().then(() => this.collectView())
		},
		page() {
			this.collectView()
		},
	},
	mounted() {
		this.collectInformation().then(() => this.collectView())
	},
})
</script>

<style scoped></style>
