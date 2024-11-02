<!--
Based on:

https://github.com/Shenmin-Z/lined-textarea/blob/master/src/LinedTextarea.vue

MIT License

Copyright (c) Zhou Shenmin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->
<template>
	<div class="lined-textarea">
		<div class="lined-textarea__lines" v-if="!disabled" :style="{ 'padding-right': longestWidth + 'px' }">
			<div class="lined-textarea__lines__inner" ref="lines">
				<template v-for="(line, index) in lines" :key="index">
					<v-tooltip :text="annotations[index]?.text" :disabled="!annotations[index]?.text">
						<template v-slot:activator="{ props }">
							<div :class="annotations[index]?.class">
								<p
									v-bind="props"
									class="lined-textarea__lines__line"
									:class="{
									'lined-textarea__lines__line--invalid': invalidLines.includes(line),
									'cursor-pointer': !!annotations[index]
								}"
									v-html="line"
								></p>
							</div>
						</template>
					</v-tooltip>
				</template>
			</div>
		</div>
		<textarea
			:disabled="disabled"
			:placeholder="placeholder"
			class="lined-textarea__content"
			:class="{
				'lined-textarea__content--disabled': disabled,
				'lined-textarea__content--wrap': !nowrap,
				'lined-textarea__content--nowrap': nowrap,
			}"
			v-model="content"
			v-on:scroll="scrollLines"
			v-on:input="onInput"
			v-on:mousedown="detectResize"
			:style="styles"
			ref="textarea"
		></textarea>
		<div class="count-helper" ref="helper"></div>
	</div>
</template>

<script lang="ts">
// @ts-nocheck
import { defineComponent } from 'vue'

export interface Annotation {
	text?: string
	class?: string
}

export default defineComponent({
	name: 'LinedTextarea',
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		nowrap: {
			type: Boolean,
			default: true,
		},
		placeholder: {
			type: String,
			default: '',
		},
		styles: {
			type: Object,
			default: () => {
				return {
					height: '300px',
				}
			},
		},
		value: {
			type: String,
			default: '',
		},
		annotations: {
			type: Object as () => Record<number, Annotation>,
			default: () => ({}),
		},
		validate: {
			type: Function,
			default: () => true,
		},
	},
	emits: ['update:modelValue'],
	data() {
		return {
			content: '',
			widthPerChar: 8, // Hard coded, ajust when necessary
			numPerLine: 1,
			previousWidth: 0,
			scrolledLength: 0,
		}
	},
	computed: {
		invalidLines() {
			const lineNumbers = []
			this.content.split('\n').forEach((line, index) => {
				if (!this.validate(line, index)) {
					lineNumbers.push(index + 1)
				}
			})
			return lineNumbers
		},
		lines() {
			if (this.content === '') return [1]
			const lineNumbers = []
			let num = 1

			// Number of lines extended. Seems to work with pre-wrap (has problem with dash)
			function getWrapTimes(sentence, width) {
				if (width <= 0) {
					// Protect against infinite loop
					console.warn('Please set the min-width of textarea to allow at least one character per line.')
					return sentence.length + 1 // Seems browser would add one additional space
				}
				const words = sentence.split(' ')
				let currentLine = 1
				let spaceLeft = width
				words.forEach((word) => {
					while (spaceLeft === width && word.length >= spaceLeft) {
						currentLine++
						word = word.slice(width)
					}
					if (spaceLeft === width) {
						spaceLeft -= word.length
						return
					}
					if (word.length + 1 > spaceLeft) {
						currentLine++
						spaceLeft = width
					}
					spaceLeft -= spaceLeft === width ? word.length : word.length + 1
				})
				return spaceLeft === width ? currentLine - 1 : currentLine
			}

			this.content.split('\n').forEach((line) => {
				const wrapTimes = getWrapTimes(line, this.numPerLine) - 1
				lineNumbers.push(num)
				for (let i = 0; i < wrapTimes; i++) {
					lineNumbers.push('&nbsp;')
				}
				num++
			})
			return lineNumbers
		},
		longestWidth() {
			for (let i = this.lines.length - 1; i >= 0; i--) {
				if (this.lines[i] === '&nbsp;') continue
				return (this.lines[i] + '').length * this.widthPerChar + 10 // 10px base padding-right
			}
		},
	},
	methods: {
		calculateCharactersPerLine() {
			// May be +-1 off real value >_<
			if (this.nowrap) {
				this.numPerLine = Number.MAX_SAFE_INTEGER
				return
			}
			const textarea = this.$refs.textarea
			const styles = getComputedStyle(textarea)
			const paddingLeft = parseFloat(styles.getPropertyValue('padding-left'))
			const paddingRight = parseFloat(styles.getPropertyValue('padding-right'))
			const fontSize = styles.getPropertyValue('font-size')
			const fontFamily = styles.getPropertyValue('font-family')
			const width = textarea.clientWidth - paddingLeft - paddingRight
			const helper = this.$refs.helper
			helper.style.fontSize = fontSize
			helper.style.fontFamily = fontFamily
			helper.innerHTML = ''
			for (let num = 1; num < 999; num++) {
				helper.innerHTML += 'a'
				if (helper.getBoundingClientRect().width > width) {
					this.numPerLine = num - 1
					break
				}
			}
		},
		detectResize() {
			const textarea = this.$refs.textarea
			const { clientWidth: w1, clientHeight: h1 } = textarea
			const detect = () => {
				const { clientWidth: w2, clientHeight: h2 } = textarea
				if (w1 !== w2 || h1 !== h2) {
					this.calculateCharactersPerLine()
				}
			}
			const stop = () => {
				this.calculateCharactersPerLine()
				document.removeEventListener('mousemove', detect)
				document.removeEventListener('mouseup', stop)
			}
			document.addEventListener('mousemove', detect)
			document.addEventListener('mouseup', stop)
		},
		onInput() {
			this.$emit('update:modelValue', this.content)
			this.recalculate()
		},
		recalculate() {
			const textarea = this.$refs.textarea
			const width = textarea.clientWidth
			if (width !== this.previousWidth) {
				this.calculateCharactersPerLine()
			}
			this.previousWidth = width
		},
		scrollLines(e) {
			this.scrolledLength = e.target.scrollTop
			this.syncScroll()
		},
		syncScroll() {
			this.$refs.lines.style.transform = `translateY(${-this.scrolledLength}px)`
		},
	},
	watch: {
		// When left area grows/shrinks e.g. 9 => 10; 100 => 99
		longestWidth(val, oldVal) {
			if (val !== oldVal) {
				this.$nextTick(() => this.calculateCharactersPerLine())
			}
		},
		nowrap() {
			this.calculateCharactersPerLine()
		},
		value(val) {
			if (val !== this.content) {
				this.content = val
			}
		},
	},
	mounted() {
		this.content = this.value
		this.syncScroll()
		this.calculateCharactersPerLine()
	},
})
</script>

<style scoped>
.lined-textarea {
	display: flex;
	font-size: 13px;
	line-height: 150%;
	font-family: Helvetica, monospace;
}

.lined-textarea__lines {
	background-color: #f0f0f0;
	border: 1px solid #d7e2ed;
	border-radius: 10px 0 0 10px;
	border-right-width: 0;
	padding: 15px 10px 15px 15px;
	overflow: hidden;
	position: relative;
}

.lined-textarea__lines__inner {
	position: absolute;
}

.lined-textarea__lines__line {
	text-align: right;
}

.lined-textarea__lines__line--invalid {
	font-weight: bold;
	color: white;
	background-color: red;
}

.lined-textarea__content {
	border: 1px solid #d7e2ed;
	border-radius: 0 10px 10px 0;
	border-left-width: 0;
	margin: 0;
	line-height: inherit;
	font-family: monospace;
	padding: 15px;
	width: 100%;
	overflow: auto;
}

.lined-textarea__content--wrap {
	white-space: pre-wrap;
}

.lined-textarea__content--nowrap {
	white-space: pre;
}

@supports (-ms-ime-align: auto) {
	.lined-textarea__content--nowrap {
		white-space: nowrap;
	}
}

.lined-textarea__content--disabled {
	border-radius: 10px;
	border-left-width: 1px;
}

.lined-textarea__content:focus {
	outline: none;
}

.count-helper {
	position: absolute;
	visibility: hidden;
	height: auto;
	width: auto;
}
</style>
