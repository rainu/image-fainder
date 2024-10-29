<template>
	<v-alert type="warning" icon="mdi-emoticon-cry-outline">
		<v-alert-title>Your browser is currently not supported.</v-alert-title>
		<strong>Reason: </strong><span>{{ reason }}</span>
	</v-alert>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	data(){
		return {
			reason: ''
		}
	},
	mounted() {
		this.reason = this.$route.query.reason
		window.history.pushState({}, '', '/')
	},
})
</script>

<style scoped></style>