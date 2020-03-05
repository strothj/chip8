export class Clock {
	private running = false;

	constructor(
		readonly interval: number,
		private readonly tickFunction: () => void,
	) {}

	private wait(waitTime: number) {
		return new Promise((resolve) => setTimeout(resolve, waitTime));
	}

	private async *createTicker() {
		let expected: number;
		let drift = 0;

		while (this.running) {
			expected = Date.now() + this.interval;
			await this.wait(Math.max(0, this.interval - drift));

			drift = Date.now() - expected;
			yield;
		}
	}

	start() {
		this.running = true;
		const ticker = this.createTicker();

		(async () => {
			for await (const _ of ticker) {
				this.tickFunction();
			}
		})();
	}

	stop() {
		this.running = false;
	}
}
