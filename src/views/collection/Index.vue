<template>
	<CollectionPicker color="primary" @change="onChange" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CollectionPicker from '../../components/CollectionPicker.vue'
import { RouteCollectionSearch, RouteCollectionAnalyse } from "../../router"

export default defineComponent({
	components: { CollectionPicker },
	methods: {
		onChange(collection: string) {
			this.$vectorDB.countRemote(collection).then((c) => {
				if(c > 0) {
					console.log("goto search")
					this.$router.push({ name: RouteCollectionSearch, params: { collection } })
				} else {
					console.log("goto analyse")
					this.$router.push({ name: RouteCollectionAnalyse, params: { collection } })
				}
			})
		},
	},
})
</script>

<style scoped></style>