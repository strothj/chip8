import { Clock, Subscription } from "./Clock.js";
import { Display } from "./Display.js";
import { Memory } from "./Memory.js";
import { Processor } from "./Processor.js";

const DISPLAY_WIDTH = 64;
const DISPLAY_HEIGHT = 32;
const TICK_INTERVAL_MS = 100;
const HERTZ = 500;
const CYCLES_PER_INTERVAL = HERTZ / (1000 / TICK_INTERVAL_MS);

async function main() {
	const url = new URL(document.location.href);
	if (url.hostname !== "localhost") {
		console.log("Production mode is not yet supported.");
		return;
	}
	console.log("Entering development mode.");

	const response = await fetch("./roms/Pong (1 player).ch8");
	const responseBody = await response.blob();
	const rom = new Uint8Array(await responseBody.arrayBuffer());
	const memory = new Memory(rom);
	const display = new Display(DISPLAY_WIDTH, DISPLAY_HEIGHT);
	const renderDebugInfo = (data: Record<string, string>) => {
		document.querySelector("dl")!.innerHTML = Object.entries(data)
			.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
			.join("\n");
	};
	const processor = new Processor(memory, display, renderDebugInfo);

	const clock = new Clock(TICK_INTERVAL_MS);
	let clockSubscription: Subscription | null = null;
	document.querySelector("svg")!.addEventListener("click", () => {
		if (!clockSubscription) {
			clockSubscription = clock.subscribe({
				next: () => {
					for (let i = 0; i < CYCLES_PER_INTERVAL; i += 1) {
						processor.performCycle();
					}
				},
				error: (error) => {
					console.error(error);
					clockSubscription = null;
				},
			});
			return;
		}

		clockSubscription.unsubscribe();
		clockSubscription = null;
	});
}

window.addEventListener("DOMContentLoaded", () => {
	main();
});
