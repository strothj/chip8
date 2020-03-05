import { Memory } from "./Memory.js";
import { Display } from "./Display.js";
import { Speaker } from "./Speaker.js";
import { Keyboard } from "./Keyboard.js";

export class Processor {
	constructor(
		private readonly memory: Memory,
		private readonly display: Display,
		private readonly speaker: Speaker,
		private readonly keyboard: Keyboard,
		private readonly onDebugEmit?: (data: Record<string, string>) => void,
	) {}

	private createUnsupportedInstructionError() {
		return new Error(JSON.stringify(this.memory.getInstruction(), null, 2));
	}

	performCycle() {
		const memory = this.memory;
		const display = this.display;
		const registerDelayValue = memory.getRegisterDelay();
		if (registerDelayValue > 0) {
			memory.setRegisterDelay(registerDelayValue - 1);
		}
		const registerSoundValue = memory.getRegisterSound();
		if (registerSoundValue > 0) {
			this.speaker.beep();
			memory.setRegisterSound(registerSoundValue - 1);
		}

		const {
			byte0,
			byte1,
			nibble0,
			nibble1,
			nibble2,
			nibble3,
			address,
		} = memory.getInstruction();
		if (this.onDebugEmit) {
			this.onDebugEmit({
				programCounter: memory.getRegisterProgramCounter().toString(16),
				byte0: byte0.toString(16),
				byte1: byte1.toString(16),
				nibble0: nibble0.toString(16),
				nibble1: nibble1.toString(16),
				nibble2: nibble2.toString(16),
				nibble3: nibble3.toString(16),
				address: address.toString(16),
			});
		}

		switch (nibble0) {
			case 0x0: {
				switch (byte1) {
					case 0xee: {
						memory.setRegisterProgramCounter(memory.stackPop());
						break;
					}

					default: {
						throw this.createUnsupportedInstructionError();
					}
				}
				break;
			}

			case 0x1: {
				memory.setRegisterProgramCounter(address - 2);
				break;
			}

			case 0x2: {
				memory.stackPush();
				memory.setRegisterProgramCounter(address - 2);
				break;
			}

			case 0x3: {
				if (memory.getRegisterV(nibble1) === byte1) {
					memory.incrementRegisterProgramCounter(2);
				}
				break;
			}

			case 0x4: {
				if (memory.getRegisterV(nibble1) !== byte1) {
					memory.incrementRegisterProgramCounter(2);
				}
				break;
			}

			// 6xkk - LD Vx, byte
			case 0x6: {
				memory.setRegisterV(nibble1, byte1);
				break;
			}

			case 0x7: {
				memory.incrementRegisterV(nibble1, byte1);
				break;
			}

			case 0x8: {
				switch (nibble3) {
					case 0x0: {
						memory.setRegisterV(
							nibble1,
							memory.getRegisterV(nibble2),
						);
						break;
					}

					case 0x2: {
						memory.setRegisterV(
							nibble1,
							memory.getRegisterV(nibble1) &
								memory.getRegisterV(nibble2),
						);
						break;
					}

					case 0x4: {
						const result =
							memory.getRegisterV(nibble1) +
							memory.getRegisterV(nibble2);
						memory.setRegisterV(nibble1, result);
						memory.setRegisterV(0xf, result > 255 ? 1 : 0);
						break;
					}

					case 0x5: {
						const result =
							memory.getRegisterV(nibble1) -
							memory.getRegisterV(nibble2);
						memory.setRegisterV(
							0xf,
							memory.getRegisterV(nibble1) >
								memory.getRegisterV(nibble2)
								? 1
								: 0,
						);
						memory.setRegisterV(nibble1, result);
						break;
					}

					default: {
						throw this.createUnsupportedInstructionError();
					}
				}
				break;
			}

			// Annn - LD I, addr
			case 0xa: {
				memory.setRegisterI(address);
				break;
			}

			case 0xc: {
				// 0 - 255
				const randomNumber = Math.floor(
					Math.random() * Math.floor(256),
				);
				memory.setRegisterV(nibble1, randomNumber & byte1);
				break;
			}

			// Dxyn - DRW Vx, Vy, nibble
			case 0xd: {
				const xPosition = memory.getRegisterV(nibble1);
				const yPosition = memory.getRegisterV(nibble2);
				const spriteByteCount = nibble3;
				let hasCollision = false;
				for (let yOffset = 0; yOffset < spriteByteCount; yOffset += 1) {
					let y = yPosition + yOffset;
					if (y >= display.height) {
						y %= display.height;
					}
					const spriteByte = memory.getMemoryByte(
						memory.getRegisterI() + yOffset,
					);
					for (let xOffset = 0; xOffset < 8; xOffset += 1) {
						let x = xPosition + xOffset;
						if (x >= display.width) {
							x %= display.width;
						}
						// 0x80 --> 1000_0000
						// Test each individual pixel and shift the result to
						// the lowest bit of the byte.
						const pixel =
							(spriteByte & (0x80 >>> xOffset)) >>> (7 - xOffset);
						const pixelOffset = display.width * y + x;
						const originalPixel = display.get(pixelOffset);
						if (pixel === originalPixel) {
							hasCollision = true;
						}
						display.set(pixelOffset, pixel ^ originalPixel);
					}
				}
				memory.setRegisterV(0xf, hasCollision ? 1 : 0);
				break;
			}

			case 0xe: {
				switch (byte1) {
					case 0xa1: {
						if (
							!this.keyboard.isKeyPressed(
								this.memory.getRegisterV(nibble1),
							)
						) {
							memory.incrementRegisterProgramCounter(2);
						}
						break;
					}

					default: {
						throw this.createUnsupportedInstructionError();
					}
				}
				break;
			}

			case 0xf: {
				switch (byte1) {
					case 0x07: {
						memory.setRegisterV(nibble1, memory.getRegisterDelay());
						break;
					}

					case 0x15: {
						memory.setRegisterDelay(memory.getRegisterV(nibble1));
						break;
					}

					case 0x18: {
						memory.setRegisterSound(memory.getRegisterV(nibble1));
						break;
					}

					case 0x29: {
						memory.setRegisterI(
							nibble1 * 5 + memory.getHexSpritesOffset(),
						);
						break;
					}

					// Fx33 - LD B, Vx
					case 0x33: {
						let value = memory.getRegisterV(nibble1);
						for (let i = 2; i >= 0; i -= 1) {
							const memoryOffset = memory.getRegisterI() + 1;
							memory.setMemoryByte(memoryOffset, value % 10);
							value = (value / 10) | 0;
							memory.setMemoryByte(
								memoryOffset,
								(memory.getMemoryByte(memoryOffset) +
									(value % 10)) <<
									4,
							);
							value = (value / 10) | 0;
						}
						break;
					}

					// Fx65 - LD Vx, [I]
					case 0x65: {
						const memoryLocation = memory.getRegisterI();
						for (let i = 0; i <= nibble1; i += 1) {
							const memoryOffset = memoryLocation + i;
							memory.setRegisterV(
								i,
								memory.getMemoryByte(memoryOffset),
							);
						}
						break;
					}

					default: {
						throw this.createUnsupportedInstructionError();
					}
				}
				break;
			}

			default: {
				throw this.createUnsupportedInstructionError();
			}
		}

		memory.incrementRegisterProgramCounter(2);
	}
}
