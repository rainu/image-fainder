<template>
	<v-dialog>
		<template v-slot:activator="{ props: activatorProps }">
			<v-btn v-bind="device.type === 'webgpu' ? activatorProps : null" icon>
				<v-icon :icon="deviceIcon" :color="deviceIconColor" size="x-large"></v-icon>
			</v-btn>
		</template>

		<template v-slot:default>
			<v-card :title="$t('device.gpu.title')">
				<v-list>
					<v-list-item v-for="([icon, key, value]) in gpuInfo" :key="key" :prepend-icon="icon" density="compact">
						<template v-if="Array.isArray(value)">
							<v-list-group :value="key" fluid>
								<template v-slot:activator="{ props }">
									<v-list-item v-bind="props" :title="$t('device.gpu.' + key)" ></v-list-item>
								</template>

								<v-list-item v-for="(item, index) of value" :key="index" prepend-icon="mdi-circle-small" density="compact">
									<v-list-item-title>{{ item }}</v-list-item-title>
								</v-list-item>
							</v-list-group>
						</template>
						<template v-else>
							<v-list-item-title>{{ $t('device.gpu.' + key) }}</v-list-item-title>
							<v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
						</template>
					</v-list-item>
				</v-list>
			</v-card>
		</template>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useAiStore } from '../store/ai.ts'

export default defineComponent({
	name: 'DeviceIndicator',
	computed: {
		...mapState(useAiStore, ['device']),
		deviceIcon() {
			if (this.device.type === 'cpu') {
				return 'mdi-cpu-64-bit'
			} else if (this.device.type === 'webgpu') {
				return 'mdi-expansion-card'
			} else {
				return 'mdi-help-circle'
			}
		},
		deviceIconColor() {
			if (this.device.type === 'cpu') {
				return 'warning'
			} else if (this.device.type === 'webgpu') {
				return 'success'
			} else {
				return 'info'
			}
		},
		gpuInfo(): [string, string, string | string[]][] {
			if (this.device.type !== 'webgpu' || !this.device.gpu.adapter) {
				return []
			}

			const features = [] as string[]
			for(let feature of this.device.gpu.adapter.features.keys()) {
				features.push(feature)
			}
			features.sort((a, b) => a.localeCompare(b))

			return [
				['mdi-wrench', 'architecture', this.device.gpu.adapter.info.architecture || 'unknown'],
				['mdi-label', 'description', this.device.gpu.adapter.info.description || '-'],
				['mdi-expansion-card-variant', 'device', this.device.gpu.adapter.info.device || 'unknown'],
				['mdi-domain', 'vendor', this.device.gpu.adapter.info.vendor || 'unknown'],
				['mdi-star-circle-outline', 'features', features],
			]
		},
	},
})
</script>

<style scoped></style>