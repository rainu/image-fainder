<template>
	<v-row dense>
		<v-col cols="12">
			<v-card v-if="localSupported">
				<v-card-title>
					<v-icon icon="mdi-folder"></v-icon>
					{{ $t('file.title') }}
				</v-card-title>
				<v-card-text>
					<v-stepper :items="localSteps" :mobile="mobile" prev-text="<" next-text=">">
						<template v-slot:item.1>
							<v-card flat>
								<v-card-title>
									<v-icon icon="mdi-folder-open-outline"></v-icon>
									{{ localSteps[0] }}
								</v-card-title>
								<v-card-text>
									{{ $t('help.local.step.1.description') }}
								</v-card-text>
							</v-card>
						</template>

						<template v-slot:item.2>
							<v-card flat>
								<v-card-title>
									<v-icon icon="mdi-folder-eye-outline"></v-icon>
									{{ localSteps[1] }}
								</v-card-title>
								<v-card-text>
									{{ $t('help.local.step.2.description') }}
								</v-card-text>
							</v-card>
						</template>

						<template v-slot:item.3>
							<v-card flat>
								<v-card-title>
									<v-icon icon="mdi-folder-search-outline"></v-icon>
									{{ localSteps[2] }}
								</v-card-title>
								<v-card-text>
									{{ $t('help.local.step.3.description') }}
								</v-card-text>
							</v-card>
						</template>
					</v-stepper>
				</v-card-text>
			</v-card>
		</v-col>

		<v-col cols="12">
			<v-card>
				<v-card-title>
					<v-icon icon="mdi-collage"></v-icon>
					{{ $t('collection.title') }}
				</v-card-title>
				<v-card-text>
					<v-stepper :items="remoteSteps" :mobile="mobile" prev-text="<" next-text=">">
						<template v-slot:item.1>
							<v-card flat>
								<v-card-title>
									<v-icon icon="mdi-collage"></v-icon>
									{{ remoteSteps[0] }}
								</v-card-title>
								<v-card-text>
									{{ $t('help.remote.step.1.description') }}
								</v-card-text>
							</v-card>
						</template>

						<template v-slot:item.2>
							<v-card flat>
								<v-card-title>
									<v-icon icon="mdi-archive-eye-outline"></v-icon>
									{{ remoteSteps[1] }}
								</v-card-title>
								<v-card-text>
									{{ $t('help.remote.step.2.description') }}
								</v-card-text>
							</v-card>
						</template>

						<template v-slot:item.3>
							<v-card flat>
								<v-card-title>
									<v-icon icon="mdi-image-search-outline"></v-icon>
									{{ remoteSteps[2] }}
								</v-card-title>
								<v-card-text>
									{{ $t('help.remote.step.3.description') }}
								</v-card-text>
							</v-card>
						</template>
					</v-stepper>
				</v-card-text>
			</v-card>
		</v-col>
	</v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { isLocalSupported } from '../support.ts'

export default defineComponent({
	data() {
		return {
			localSupported: isLocalSupported(),
		}
	},
	computed: {
		mobile() {
			return String(this.$vuetify.display.name) === 'xs'
		},
		localSteps() {
			return [
				this.$t('help.local.step.1.title'),
				this.$t('help.local.step.2.title'),
				this.$t('help.local.step.3.title'),
			]
		},
		remoteSteps() {
			return [
				this.$t('help.remote.step.1.title'),
				this.$t('help.remote.step.2.title'),
				this.$t('help.remote.step.3.title'),
			]
		},
	},
})
</script>

<style scoped></style>
