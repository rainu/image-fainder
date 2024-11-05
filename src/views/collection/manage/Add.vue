<template>
	<LinedTextarea v-model="newItems" :annotations="itemAnnotations" :styles="{ height: '75vh' }"></LinedTextarea>
	<v-expansion-panels>
		<v-expansion-panel v-show="Object.keys(itemAnnotations).length > 0">
			<v-expansion-panel-title>
				{{
					$t('collection.manage.validation.summary', {
						success: Object.values(itemAnnotations).filter((a) => a.class === 'success').length,
						errors: Object.values(itemAnnotations).filter((a) => a.class === 'error').length,
						warnings: Object.values(itemAnnotations).filter((a) => a.class === 'warning').length,
					})
				}}
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<v-list>
					<v-list-item v-for="(value, key) in itemAnnotations" :key="key">
						<v-alert :type="value.class || undefined" variant="tonal" density="compact">
							<v-alert-title>{{ value.text }}</v-alert-title>
							<span class="progress-alert-line-content"> {{ Number(key) + 1 }}: {{ value.line }} </span>
						</v-alert>
					</v-list-item>
				</v-list>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>

	<v-app-bar location="bottom" elevation="0" density="compact">
		<v-container>
			<v-btn color="primary" variant="elevated" block :disabled="!newItems" @click="onAddItems">
				<v-icon icon="mdi-image-plus"></v-icon>
				{{ $t('collection.manage.add') }}
			</v-btn>
		</v-container>
	</v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LinedTextarea, { Annotation } from '../../../components/LinedTextarea.vue'
import { remoteFileURI } from '../../../database/uri.ts'

type AdvancedAnnotation = Annotation & { line: string; class: 'error' | 'success' | 'warning' }

export default defineComponent({
	components: { LinedTextarea },
	data() {
		return {
			newItems: null as string | null,
			itemAnnotations: {} as Record<number, AdvancedAnnotation>,
		}
	},
	computed: {
		collectionName(): string {
			if (Array.isArray(this.$route.params.collection)) {
				return this.$route.params.collection[0]
			}
			return this.$route.params.collection
		},
	},
	methods: {
		async onAddItems() {
			if (!this.newItems) {
				return
			}
			this.itemAnnotations = {}

			const lines = this.newItems.split('\n')
			const validLines = lines.filter((line, idx) => {
				const valid = URL.canParse(line)
				if (!valid) {
					this.itemAnnotations[idx] = {
						line,
						text: this.$t('collection.manage.validation.invalid.url'),
						class: 'error',
					}
				}

				return valid
			})

			for (let i in validLines) {
				const line = validLines[i]
				try {
					const uri = remoteFileURI(this.collectionName, line)
					const exists = await this.$vectorDB.exists(uri)

					if (exists) {
						this.itemAnnotations[i] = {
							line,
							text: this.$t('collection.manage.validation.invalid.exists'),
							class: 'warning',
						}
					} else {
						await this.$vectorDB.saveRemote({
							collection: this.collectionName,
							uri: uri,
							embedding: Float32Array.from([]),
						})

						this.itemAnnotations[i] = {
							line,
							class: 'success',
						}
					}
				} catch (e: unknown) {
					const error = e as Error
					this.itemAnnotations[i] = {
						line,
						text: this.$t('collection.manage.validation.invalid.error', { error: error.message }),
						class: 'error',
					}
				}
			}
		},
	},
})
</script>

<style>
a {
	text-decoration: none;
	color: inherit;
}

.lined-textarea .error {
	background-color: red;
	color: white;
}

.lined-textarea .warning {
	background-color: yellow;
	color: black;
}

.lined-textarea .success {
	background-color: greenyellow;
	color: black;
}

.progress-alert-line-content {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	word-break: break-all;
}
</style>
