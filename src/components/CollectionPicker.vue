<template>
	<v-dialog v-model="show">
		<template v-slot:activator="{ props: activatorProps }">
			<v-btn v-bind="activatorProps" :variant="variant" :color="color" block>
				<v-icon icon="mdi-collage"></v-icon>
				{{ btnLabel }}
			</v-btn>
		</template>

		<template v-slot:default>
			<v-card :title="$t('collection.chooser.title')">
				<v-card-text>
					<v-row>
						<v-col cols="6" md="4" lg="2" v-for="collection of availableCollections" :key="collection">
							<v-list-item class="cursor-pointer" prepend-icon="mdi-folder" @click="onAvailableCollection(collection)">
								<v-list-item-title>{{ collection }}</v-list-item-title>
							</v-list-item>
						</v-col>
					</v-row>
				</v-card-text>
				<v-card-actions>
					<v-row dense>
						<v-col cols="12" sm="8">
							<v-text-field
								:label="$t('collection.chooser.new.name')"
								density="compact"
								v-model="newCollection"
								@keydown.enter.prevent="onAdd"
							></v-text-field>
						</v-col>
						<v-col cols="12" sm="4">
							<v-btn variant="elevated" color="primary" block @click="onAdd">
								<v-icon icon="mdi-folder-plus-outline"></v-icon>
								{{ $t('collection.chooser.new.add') }}
							</v-btn>
						</v-col>
					</v-row>
				</v-card-actions>
			</v-card>
		</template>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	name: 'CollectionPicker',
	emits: ['change'],
	props: {
		variant: {
			type: String as () => 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain',
			default: 'elevated',
		},
		color: {
			type: String,
			default: null,
		},
	},
	data() {
		return {
			show: false,
			newCollection: '',
			availableCollections: [] as string[],
		}
	},
	computed: {
		collectionName(): string | null {
			if (!this.$route.params.collection) {
				return null
			}

			if (Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		},
		btnLabel() {
			if (this.collectionName) {
				return this.collectionName
			} else {
				return this.$t('collection.chooser.title')
			}
		},
	},
	methods: {
		async updateAvailableCollections() {
			this.availableCollections = (await this.$vectorDB.getRemoteCollections()).sort()
		},
		onAvailableCollection(collection: string) {
			this.changeCollection(collection)
		},
		async onAdd() {
			this.changeCollection(this.newCollection)
			this.newCollection = ''
		},
		changeCollection(collection: string) {
			this.$emit('change', collection)
			this.show = false
		},
	},
	watch: {
		collectionName(_collection: string | null) {
			this.updateAvailableCollections()
		},
	},
	mounted() {
		this.updateAvailableCollections()
	},
})
</script>

<style scoped></style>
