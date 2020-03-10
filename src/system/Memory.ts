export type Instruction = Record<
  "byte0" | "byte1" | "nibble0" | "nibble1" | "nibble2" | "nibble3" | "address",
  number
>;

const MEMORY_LENGTH = 0x1000;
const MEMORY_OFFSET_ENTRY_POINT = 0x200;
const MEMORY_OFFSET_HEX_SPRITES = 0x0;
const MAX_STACK_SIZE = 16;
const VALUE_REGISTERS_COUNT = 16;

export class Memory {
  private readonly memory = new Uint8Array(MEMORY_LENGTH);
  private registerProgramCounter!: number;
  private registerDelayTimer!: number;
  private registerSoundTimer!: number;
  private readonly stack = new Uint16Array(MAX_STACK_SIZE);
  private registerStackPointer!: number;
  private readonly registersV = new Uint8Array(VALUE_REGISTERS_COUNT);
  private registerI!: number;

  constructor(private readonly rom: Uint8Array) {
    this.reset();
  }

  reset() {
    this.memory.fill(0);
    this.memory.set(this.rom, MEMORY_OFFSET_ENTRY_POINT);
    this.memory.set(
      [
        0xf0,
        0x90,
        0x90,
        0x90,
        0xf0, // "0"
        0x20,
        0x60,
        0x20,
        0x20,
        0x70, // "1"
        0xf0,
        0x10,
        0xf0,
        0x80,
        0xf0, // "2"
        0xf0,
        0x10,
        0xf0,
        0x10,
        0xf0, // "3"
        0x90,
        0x90,
        0xf0,
        0x10,
        0x10, // "4"
        0xf0,
        0x80,
        0xf0,
        0x10,
        0xf0, // "5"
        0xf0,
        0x80,
        0xf0,
        0x90,
        0xf0, // "6"
        0xf0,
        0x10,
        0x20,
        0x40,
        0x40, // "7"
        0xf0,
        0x90,
        0xf0,
        0x90,
        0xf0, // "8"
        0xf0,
        0x90,
        0xf0,
        0x10,
        0xf0, // "9"
        0xf0,
        0x90,
        0xf0,
        0x90,
        0x90, // "A"
        0xe0,
        0x90,
        0xe0,
        0x90,
        0xe0, // "B"
        0xf0,
        0x80,
        0x80,
        0x80,
        0xf0, // "C"
        0xe0,
        0x90,
        0x90,
        0x90,
        0xe0, // "D"
        0xf0,
        0x80,
        0xf0,
        0x80,
        0xf0, // "E"
        0xf0,
        0x80,
        0xf0,
        0x80,
        0x80, // "F"
      ],
      MEMORY_OFFSET_HEX_SPRITES,
    );
    this.registerProgramCounter = MEMORY_OFFSET_ENTRY_POINT;
    this.registerDelayTimer = 0;
    this.registerSoundTimer = 0;
    this.stack.fill(0);
    this.registerStackPointer = -1;
    this.registersV.fill(0);
    this.registerI = 0;
  }

  private assertMemoryOffsetInRange(offset: number) {
    if (offset < 0 || offset >= this.memory.length) {
      throw new Error("Out of range memory access.");
    }
  }

  private assert8BitRegisterInRange(value: number) {
    if (value < 0 || value >= 255) {
      throw new Error("Attempt to set out of range 8-bit register value.");
    }
  }

  private assertInstructionAddressInRange(address: number) {
    this.assertMemoryOffsetInRange(address);
    if (address % 2 !== 0) {
      throw new Error("Attempt to set program counter to odd offset.");
    }
  }

  private assertValueRegisterInRange(register: number) {
    if (register < 0 || register >= VALUE_REGISTERS_COUNT) {
      throw new Error("Attempt to access nonexistent value register.");
    }
  }

  getRegisterDelay() {
    return this.registerDelayTimer;
  }

  setRegisterDelay(value: number) {
    this.assert8BitRegisterInRange(value);
    this.registerDelayTimer = value;
  }

  getRegisterSound() {
    return this.registerSoundTimer;
  }

  setRegisterSound(value: number) {
    this.assert8BitRegisterInRange(value);
    this.registerSoundTimer = value;
  }

  getMemoryByte(offset: number) {
    this.assertMemoryOffsetInRange(offset);
    return this.memory[offset];
  }

  setMemoryByte(offset: number, value: number) {
    this.assertMemoryOffsetInRange(offset);
    this.memory[offset] = value;
  }

  getInstruction(): Instruction {
    const byte0 = this.getMemoryByte(this.registerProgramCounter);
    const byte1 = this.getMemoryByte(this.registerProgramCounter + 1);
    const nibble0 = (byte0 & 0xf0) >>> 4;
    const nibble1 = byte0 & 0x0f;
    const nibble2 = (byte1 & 0xf0) >>> 4;
    const nibble3 = byte1 & 0x0f;
    const address = (nibble1 << 8) | byte1;

    return {
      byte0,
      byte1,
      nibble0,
      nibble1,
      nibble2,
      nibble3,
      address,
    };
  }

  stackPop() {
    if (this.registerStackPointer === -1) {
      throw new Error("Attempt to pop empty stack.");
    }
    return this.stack[this.registerStackPointer--];
  }

  stackPush(maybeAddress?: number) {
    if (this.registerStackPointer === MAX_STACK_SIZE - 1) {
      throw new Error("Stack overflow.");
    }
    const address = maybeAddress ?? this.registerProgramCounter;
    this.assertInstructionAddressInRange(address);
    this.stack[++this.registerStackPointer] = address;
  }

  getRegisterProgramCounter() {
    return this.registerProgramCounter;
  }

  setRegisterProgramCounter(address: number) {
    this.assertInstructionAddressInRange(address);
    this.registerProgramCounter = address;
  }

  incrementRegisterProgramCounter(delta: number) {
    const address = this.getRegisterProgramCounter() + delta;
    this.setRegisterProgramCounter(address);
  }

  getRegisterV(register: number) {
    this.assertValueRegisterInRange(register);
    return this.registersV[register];
  }

  setRegisterV(register: number, value: number) {
    this.assertValueRegisterInRange(register);
    this.registersV[register] = value;
  }

  incrementRegisterV(register: number, delta: number) {
    const value = this.getRegisterV(register) + delta;
    this.setRegisterV(register, value);
  }

  getRegisterI() {
    return this.registerI;
  }

  setRegisterI(value: number) {
    this.registerI = value;
  }

  getHexSpritesOffset() {
    return MEMORY_OFFSET_HEX_SPRITES;
  }
}
