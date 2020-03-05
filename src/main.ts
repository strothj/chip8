import { Clock } from "./Clock.js";

const enum Constants {
	MemoryLength = 0x1000,
	EntryPoint = 0x200,
	RegisterCount = 0x10,
	Register16BitCount = 0x01,
	TimersCount = 0x2,
	TickRate = 1000 / 60,
	DisplayWidth = 64,
	DisplayHeight = 32,
}

async function main() {
	const url = new URL(document.location.href);
	if (url.hostname !== "localhost") {
		console.log("Production mode is not yet supported.");
		return;
	}
	console.log("Entering development mode.");

	const canvas = document.querySelector("canvas")!;
	canvas.width = Constants.DisplayWidth;
	canvas.height = Constants.DisplayHeight;
	const canvasContext = canvas.getContext("2d")!;
	canvasContext.imageSmoothingEnabled = true;

	const response = await fetch("./roms/Pong (1 player).ch8");
	const responseBody = await response.blob();
	const rom = new Uint8Array(await responseBody.arrayBuffer());

	const memory = new Uint8Array(Constants.MemoryLength);
	memory.set(rom, Constants.EntryPoint);

	const registersV = new Uint8Array(Constants.RegisterCount);
	const registersI = new Uint16Array(Constants.Register16BitCount);
	// @ts-ignore
	const registersTimers = new Uint8Array(Constants.TimersCount);
	let programCounter = Constants.EntryPoint;
	// @ts-ignore
	let stackPointer: number = 0;
	// @ts-ignore
	let stack: number[] = [];
	// @ts-ignore
	const display = new Uint8Array(
		Constants.DisplayWidth * Constants.DisplayHeight,
	);

	const clock = new Clock(Constants.TickRate, () => {
		const instructionByte0 = memory[programCounter];
		const instructionByte1 = memory[programCounter + 1];
		const nibble0 = (instructionByte0 & 0xf0) >>> 4;
		const nibble1 = instructionByte0 & 0x0f;
		const nibble2 = (instructionByte1 & 0xf0) >>> 4;
		const nibble3 = instructionByte1 & 0x0f;
		const address = (nibble1 << 8) | instructionByte1;
		console.table({
			programCounter,
			mem0: memory[programCounter].toString(16),
			mem1: memory[programCounter + 1].toString(16),
			nibble0: nibble0.toString(16),
			nibble1: nibble1.toString(16),
			nibble2: nibble2.toString(16),
			nibble3: nibble3.toString(16),
			address: address.toString(16),
		});

		switch (nibble0) {
			// 6xkk - LD Vx, byte
			case 0x6: {
				registersV[nibble1] = instructionByte1;
				break;
			}

			// Annn - LD I, addr
			case 0xa: {
				registersI[0] = address;
				break;
			}

			// Dxyn - DRW Vx, Vy, nibble
			case 0xd: {
				console.group("Draw");
				// @ts-ignore
				const xPosition = registersV[nibble1];
				// @ts-ignore
				const yPosition = registersV[nibble2];
				const spriteByteCount = nibble3;
				let hasCollision = false;
				for (let yOffset = 0; yOffset < spriteByteCount; yOffset += 1) {
					let y = yPosition + yOffset;
					if (y >= Constants.DisplayHeight) {
						y %= Constants.DisplayHeight;
					}
					const spriteByte = memory[registersI[0] + yOffset];
					console.log(spriteByte.toString(2));
					console.group("Line");
					for (let xOffset = 0; xOffset < 8; xOffset += 1) {
						let x = xPosition + xOffset;
						if (x >= Constants.DisplayWidth) {
							x %= Constants.DisplayWidth;
						}
						// 0x80 --> 1000_0000
						// Test each individual pixel and shift the result to
						// the lowest bit of the byte.
						const pixel =
							(spriteByte & (0x80 >>> xOffset)) >>> (7 - xOffset);
						const pixelOffset = Constants.DisplayWidth * y + x;
						const originalPixel = display[pixelOffset];
						if (pixel === originalPixel) {
							hasCollision = true;
						}
						display[pixelOffset] = pixel ^ originalPixel;
						console.log(pixel.toString(2));
					}
					console.groupEnd();
				}
				registersV[0xf] = hasCollision ? 1 : 0;
				console.log(display);
				console.groupEnd();
				break;
			}

			default: {
				console.error("Unsupported instruction:", nibble0.toString(16));
				clock.stop();
			}
		}

		for (let y = 0; y < Constants.DisplayHeight; y += 1) {
			for (let x = 0; x < Constants.DisplayWidth; x += 1) {
				canvasContext.fillStyle =
					display[Constants.DisplayWidth * y + x] === 0
						? "#fff"
						: "#000";
				canvasContext.fillRect(x, y, 1, 1);
			}
		}

		programCounter += 2;
	});
	clock.start();
}

window.addEventListener("DOMContentLoaded", () => {
	main();
});
