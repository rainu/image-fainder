export const delayProgress = (clb: (value: number) => void, delay: number = 500) => {
	let i = 0
	let t = new Date().getTime()
	return {
		add(value: number = 1) {
			this.set(i + value)
		},
		set(value: number) {
			// don't waste too much time for displaying progress
			// it will cost performance! so here we update the
			// progress every <delay>

			const duration = new Date().getTime() - t
			if (duration >= delay) {
				t = new Date().getTime()
				clb(i)
			}
			i = value
		}
	}
}
