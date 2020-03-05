import { Clock } from "./Clock.js";
import { loadHexSprites } from "./loadHexSprites.js";

const enum Constants {
	MemoryLength = 0x1000,
	EntryPoint = 0x200,
	RegisterCount = 0x10,
	Register16BitCount = 0x01,
	DelayTimersCount = 0x2,
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
	loadHexSprites(memory);

	const registersV = new Uint8Array(Constants.RegisterCount);
	const registersI = new Uint16Array(Constants.Register16BitCount);
	const registersDelayTimers = new Uint8Array(Constants.DelayTimersCount);
	const registersSoundTimers = new Uint8Array(1);
	let programCounter: number = Constants.EntryPoint;
	let stack: number[] = [];
	const display = new Uint8Array(
		Constants.DisplayWidth * Constants.DisplayHeight,
	);

	const clock = new Clock(Constants.TickRate, () => {
		if (registersDelayTimers[0] > 0) {
			registersDelayTimers[0]--;
		}
		if (registersSoundTimers[0] > 0) {
			console.log("Speaker!");
			registersSoundTimers[0]--;
			if (registersSoundTimers[0] === 0) {
				console.log("Speaker stop.");
			}
		}

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
			case 0x0: {
				switch (instructionByte1) {
					case 0xee: {
						const poppedAddress = stack.pop();
						if (poppedAddress === undefined) {
							clock.stop();
							console.error("Stack empty.");
							break;
						}
						programCounter = poppedAddress;
						break;
					}

					default: {
						console.error(
							"Unsupported instruction:",
							nibble0.toString(16),
						);
						clock.stop();
					}
				}
				break;
			}

			case 0x1: {
				programCounter = address - 2;
				break;
			}

			case 0x2: {
				stack.push(programCounter);
				programCounter = address - 2;
				break;
			}

			case 0x3: {
				if (registersV[nibble1] === instructionByte1) {
					programCounter += 2;
				}
				break;
			}

			case 0x4: {
				if (registersV[nibble1] !== instructionByte1) {
					programCounter += 2;
				}
				break;
			}

			// 6xkk - LD Vx, byte
			case 0x6: {
				registersV[nibble1] = instructionByte1;
				break;
			}

			case 0x7: {
				registersV[nibble1] += instructionByte1;
				break;
			}

			case 0x8: {
				switch (nibble3) {
					case 0x0: {
						registersV[nibble1] = registersV[nibble2];
						break;
					}

					case 0x2: {
						registersV[nibble1] =
							registersV[nibble1] & registersV[nibble2];
						break;
					}

					case 0x4: {
						const result =
							registersV[nibble1] + registersV[nibble2];
						registersV[nibble1] = result;
						registersV[0xf] = result > 255 ? 1 : 0;
						break;
					}

					case 0x5: {
						const result =
							registersV[nibble1] - registersV[nibble2];
						registersV[0xf] =
							registersV[nibble1] > registersV[nibble2] ? 1 : 0;
						registersV[nibble1] = result;
						break;
					}

					default: {
						console.error(
							"Unsupported instruction:",
							nibble0.toString(16),
						);
						clock.stop();
					}
				}
				break;
			}

			// Annn - LD I, addr
			case 0xa: {
				registersI[0] = address;
				break;
			}

			case 0xc: {
				// 0 - 255
				const randomNumber = Math.floor(
					Math.random() * Math.floor(256),
				);
				registersV[nibble1] = randomNumber & instructionByte1;
				break;
			}

			// Dxyn - DRW Vx, Vy, nibble
			case 0xd: {
				const xPosition = registersV[nibble1];
				const yPosition = registersV[nibble2];
				const spriteByteCount = nibble3;
				let hasCollision = false;
				for (let yOffset = 0; yOffset < spriteByteCount; yOffset += 1) {
					let y = yPosition + yOffset;
					if (y >= Constants.DisplayHeight) {
						y %= Constants.DisplayHeight;
					}
					const spriteByte = memory[registersI[0] + yOffset];
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
					}
				}
				registersV[0xf] = hasCollision ? 1 : 0;
				break;
			}

			case 0xe: {
				switch (instructionByte1) {
					case 0xa1: {
						// TODO: Implement keyboard.
						programCounter += 2;
						break;
					}

					default: {
						console.error(
							"Unsupported instruction:",
							nibble0.toString(16),
						);
						clock.stop();
					}
				}
				break;
			}

			case 0xf: {
				switch (instructionByte1) {
					case 0x07: {
						registersV[nibble1] = registersDelayTimers[0];
						break;
					}

					case 0x15: {
						registersDelayTimers[0] = registersV[nibble1];
						break;
					}

					case 0x18: {
						registersSoundTimers[0] = registersV[nibble1];
						break;
					}

					case 0x29: {
						registersI[0] = nibble1 * 5;
						break;
					}

					// Fx33 - LD B, Vx
					case 0x33: {
						let value = registersV[nibble1];
						for (let i = 2; i >= 0; i -= 1) {
							memory[registersI[0] + i] = value % 10;
							value = (value / 10) | 0;
							memory[registersI[0] + i] += value % 10 << 4;
							value = (value / 10) | 0;
						}
						break;
					}

					// Fx65 - LD Vx, [I]
					case 0x65: {
						for (let i = 0; i <= nibble1; i += 1) {
							registersV[0] = memory[registersI[0] + i];
						}
						break;
					}

					default: {
						console.error(
							"Unsupported instruction:",
							nibble0.toString(16),
						);
						clock.stop();
					}
				}
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
				canvasContext.strokeStyle = "transparent";
				canvasContext.lineWidth = 1;
				// canvasContext.lineJoin = ""
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
