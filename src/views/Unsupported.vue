<template>
	<v-alert type="warning" icon="mdi-emoticon-cry-outline">
		<v-alert-title>{{ $t('browser.feature.support.missing.title') }}</v-alert-title>
		<strong>{{ $t('browser.feature.support.missing.reason') }}: </strong><span>{{ reason }}</span>
	</v-alert>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	data(){
		return {
			reason: null as string | null
		}
	},
	mounted() {
		const reasonQuery = this.$route.query.reason
		this.reason = Array.isArray(reasonQuery) ? reasonQuery[0] : reasonQuery

		if (this.reason) {
			this.reason = this.$t(this.reason)
		}

		window.history.pushState({}, '', '/')
	},
})
</script>

<style scoped></style>