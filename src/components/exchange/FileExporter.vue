<template>
	<v-row>
		<v-col cols="12">
			<v-card v-if="availableCollections.local.length > 0">
				<v-card-title>
					<v-icon icon="mdi-folder-open-outline"></v-icon>
					{{ $t('file.title') }}
				</v-card-title>
				<v-card-text>
					<v-row dense>
						<v-col cols="12" sm="6" md="4" lg="2" v-for="name of availableCollections.local" :key="name">
							<v-checkbox v-model="selectedCollections.local" :label="name" :value="name" hide-details></v-checkbox>
						</v-col>
					</v-row>
				</v-card-text>
				<v-card-actions>
					<v-row dense>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectNoneLocal">
								<v-icon icon="mdi-checkbox-blank-off-outline"></v-icon>
								{{ $t('exchange.export.select.none') }}
							</v-btn>
						</v-col>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectAllLocal">
								<v-icon icon="mdi-check-all"></v-icon>
								{{ $t('exchange.export.select.all') }}
							</v-btn>
						</v-col>
					</v-row>
				</v-card-actions>
			</v-card>
		</v-col>

		<v-col cols="12">
			<v-card v-if="availableCollections.remote.length > 0">
				<v-card-title>
					<v-icon icon="mdi-collage"></v-icon>
					{{ $t('collection.title') }}
				</v-card-title>
				<v-card-text>
					<v-row dense>
						<v-col cols="12" sm="6" md="4" lg="2" v-for="name of availableCollections.remote" :key="name">
							<v-checkbox v-model="selectedCollections.remote" :label="name" :value="name" hide-details></v-checkbox>
						</v-col>
					</v-row>
				</v-card-text>
				<v-card-actions>
					<v-row dense>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectNoneRemote">
								<v-icon icon="mdi-checkbox-blank-off-outline"></v-icon>
								{{ $t('exchange.export.select.none') }}
							</v-btn>
						</v-col>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectAllRemote">
								<v-icon icon="mdi-check-all"></v-icon>
								{{ $t('exchange.export.select.all') }}
							</v-btn>
						</v-col>
					</v-row>
				</v-card-actions>
			</v-card>
		</v-col>
	</v-row>

	<v-app-bar location="bottom" elevation="0" density="compact">
		<v-container>
			<v-btn
				@click="onClick"
				block
				color="primary"
				variant="elevated"
				:disabled="selectedCollections.local.length + selectedCollections.remote.length === 0"
			>
				<v-icon icon="mdi-file-export"></v-icon>
				{{ $t('exchange.export.title') }}
			</v-btn>
		</v-container>
		<ProgressDialog
			v-if="progress.status"
			:title="$t('exchange.export.title')"
			:current="progress.current"
			:total="progress.total"
			:unit="$t('progress.duration.unit.image')"
			@interrupt="onInterrupt"
		/>
	</v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { exportFile } from './exchange'
import { delayProgress } from '../progress/delayed.ts'
import ProgressDialog from '../progress/Dialog.vue'

export default defineComponent({
	name: 'FileExporter',
	components: { ProgressDialog },
	data() {
		return {
			progress: {
				status: false,
				current: 0,
				total: 0,
				interrupted: false,
			},
			selectedCollections: {
				local: [] as string[],
				remote: [] as string[],
			},
			availableCollections: {
				local: [] as string[],
				remote: [] as string[],
			},
		}
	},
	methods: {
		onInterrupt() {
			this.progress.interrupted = true
		},
		async onClick() {
			try {
				const file = await window.showSaveFilePicker()
				this.progress.status = true

				const delayedProgression = delayProgress((i) => (this.progress.current = i))
				await exportFile(
					file,
					this.$vectorDB,
					this.selectedCollections.local,
					this.selectedCollections.remote,
					(current, total) => {
						this.progress.total = total
						delayedProgression.set(current)
					},
					() => this.progress.interrupted,
				)
			} catch (e) {
				console.error(e)
			}

			this.progress.status = false
			this.progress.interrupted = false
		},
		selectAllLocal() {
			this.selectedCollections.local = [...this.availableCollections.local]
		},
		selectNoneLocal() {
			this.selectedCollections.local = []
		},
		selectAllRemote() {
			this.selectedCollections.remote = [...this.availableCollections.remote]
		},
		selectNoneRemote() {
			this.selectedCollections.remote = []
		},
		async updateAvailableCollections() {
			const [local, remote] = await Promise.all([
				this.$vectorDB.getLocalDirectories(),
				this.$vectorDB.getRemoteCollections(),
			])

			this.availableCollections.local = local.sort()
			this.availableCollections.remote = remote.sort()

			this.selectAllLocal()
			this.selectAllRemote()
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
