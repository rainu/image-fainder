<template>
	<v-app-bar>
		<v-app-bar-nav-icon variant="text" @click.stop="$emit('onLeft')" />
		<v-spacer />
		<strong v-if="collectionName">
			<CollectionPicker variant="outlined" @change="onCollectionChange" />
		</strong>
		<strong v-else-if="mainDirectory">
			<DirectoryPicker variant="outlined" />
		</strong>
		<v-spacer />

		<template v-slot:append>
			<DeviceIndicator />
			<v-btn icon="mdi-cog" @click.stop="$emit('onRight')"></v-btn>
		</template>
	</v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DirectoryPicker from '../DirectoryPicker.vue'
import CollectionPicker from '../CollectionPicker.vue'
import DeviceIndicator from '../DeviceIndicator.vue'
import { mapState } from "pinia"
import { useFileStore } from "../../store/file.ts"

export default defineComponent({
	name: 'HeadBar',
	components: { DeviceIndicator, CollectionPicker, DirectoryPicker },
	emits: ['onLeft', 'onRight'],
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
	},
	methods: {
		onCollectionChange(collection: string) {
			if(!this.$route.name) {
				return
			}

			this.$router.push({
				name: this.$route.name,
				params: {
					...this.$route.params,
					collection,
				},
			})
		},
	}
})
</script>

<style scoped></style>