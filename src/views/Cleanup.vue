<template>
	<v-row>
		<v-col cols="12" v-show="directories.length > 0">
			<v-card>
				<v-card-title>
					<v-icon icon="mdi-folder-open-outline"></v-icon>
					{{ $t('cleanup.local.title') }}
				</v-card-title>
				<v-card-text>
					<v-row dense>
						<v-col cols="12" sm="6" md="4" lg="2" v-for="directory of directories" :key="directory.name">
							<v-checkbox
								v-model="selectedCollections.local"
								:label="directory.name + ' (' + directory.count + ')'"
								:value="directory.name"
								hide-details
							></v-checkbox>
						</v-col>
					</v-row>
				</v-card-text>

				<v-card-actions>
					<v-row dense>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectNoneLocal">
								<v-icon icon="mdi-checkbox-blank-off-outline"></v-icon>
								{{ $t('cleanup.select.none') }}
							</v-btn>
						</v-col>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectAllLocal">
								<v-icon icon="mdi-check-all"></v-icon>
								{{ $t('cleanup.select.all') }}
							</v-btn>
						</v-col>
					</v-row>
				</v-card-actions>
			</v-card>
		</v-col>

		<v-col cols="12" v-show="collections.length > 0">
			<v-card>
				<v-card-title>
					<v-icon icon="mdi-collage"></v-icon>
					{{ $t('cleanup.remote.title') }}
				</v-card-title>
				<v-card-text>
					<v-row dense>
						<v-col cols="12" sm="6" md="4" lg="2" v-for="collection of collections" :key="collection.name">
							<v-checkbox
								v-model="selectedCollections.remote"
								:label="collection.name + ' (' + collection.count + ')'"
								:value="collection.name"
								hide-details
							></v-checkbox>
						</v-col>
					</v-row>
				</v-card-text>

				<v-card-actions>
					<v-row dense>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectNoneRemote">
								<v-icon icon="mdi-checkbox-blank-off-outline"></v-icon>
								{{ $t('cleanup.select.none') }}
							</v-btn>
						</v-col>
						<v-col cols="12" sm="6">
							<v-btn block @click="selectAllRemote">
								<v-icon icon="mdi-check-all"></v-icon>
								{{ $t('cleanup.select.all') }}
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
				@click="onDelete"
				block
				color="error"
				variant="elevated"
				:disabled="selectedCollections.local.length + selectedCollections.remote.length === 0"
			>
				<v-icon icon="mdi-delete"></v-icon>
				{{ $t('cleanup.delete') }}
			</v-btn>
		</v-container>
		<ProgressDialog
			v-if="progress.status"
			:title="$t('cleanup.title')"
			:current="progress.current"
			:total="progress.total"
			@interrupt="progress.interrupted = true"
		/>
	</v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ProgressDialog from '../components/progress/Dialog.vue'
import { delayProgress } from '../components/progress/delayed.ts'

type NameAndCount = {
	name: string
	count: number
}

export default defineComponent({
	components: { ProgressDialog },
	data() {
		return {
			directories: [] as NameAndCount[],
			collections: [] as NameAndCount[],
			selectedCollections: {
				remote: [] as string[],
				local: [] as string[],
			},
			progress: {
				status: false,
				current: 0,
				total: 0,
				interrupted: false,
			},
		}
	},
	methods: {
		collectInformation() {
			this.$vectorDB.getLocalDirectories().then(async (locals) => {
				const result = []
				for (let name of locals) {
					const count = await this.$vectorDB.countLocal(name)
					result.push({ name, count })
				}
				result.sort((a, b) => a.name.localeCompare(b.name))

				this.directories = result
			})
			this.$vectorDB.getRemoteCollections().then(async (collections) => {
				const result = []
				for (let name of collections) {
					const count = await this.$vectorDB.countRemote(name)
					result.push({ name, count })
				}
				result.sort((a, b) => a.name.localeCompare(b.name))

				this.collections = result
			})
		},
		selectAllLocal() {
			this.selectedCollections.local = [...this.directories.map((d) => d.name)]
		},
		selectNoneLocal() {
			this.selectedCollections.local = []
		},
		selectAllRemote() {
			this.selectedCollections.remote = [...this.collections.map((c) => c.name)]
		},
		selectNoneRemote() {
			this.selectedCollections.remote = []
		},
		async onDelete() {
			this.progress.status = true
			this.progress.interrupted = false

			this.progress.total = 0
			this.progress.total += this.selectedCollections.local
				.map((name) => {
					const i = this.directories.find((d) => d.name === name)
					return i ? i.count : 0
				})
				.reduce((a, b) => a + b, 0)
			this.progress.total += this.selectedCollections.remote
				.map((name) => {
					const i = this.collections.find((d) => d.name === name)
					return i ? i.count : 0
				})
				.reduce((a, b) => a + b, 0)

			const delayedProgression = delayProgress((i) => (this.progress.current = i))

			for (let directory of this.selectedCollections.local) {
				await this.$vectorDB.deleteLocal(directory, (): boolean => {
					delayedProgression.add(1)
					return !this.progress.interrupted
				})
			}

			for (let collection of this.selectedCollections.remote) {
				await this.$vectorDB.deleteRemote(collection, (): boolean => {
					delayedProgression.add(1)
					return !this.progress.interrupted
				})
			}

			this.progress.status = false
			this.collectInformation()
		},
	},
	mounted() {
		this.collectInformation()
	},
})
</script>

<style scoped></style>
