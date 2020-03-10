/*
1	2	3	C
4	5	6	D
7	8	9	E
A	0	B	F
*/
/**
 * Mapping of keyboard keys to their hex digits with the addition that 2, 4, 6,
 * and 8 are also mapped to the directional arrows.
 */
const keyMappings = Array.from({ length: 0x10 }, (_, hexKey) => {
  const mapping: string[] = [hexKey.toString(16)];
  switch (hexKey) {
    case 2: {
      mapping.push("ArrowDown");
      break;
    }

    case 4: {
      mapping.push("ArrowLeft");
      break;
    }

    case 6: {
      mapping.push("ArrowRight");
      break;
    }

    case 8: {
      mapping.push("ArrowUp");
      break;
    }
  }
  return mapping;
});

export class Keyboard {
  private readonly pressStates = new Array<boolean>(0x10).fill(false);

  constructor() {
    if (!process.browser) {
      return;
    }

    const getMappingIndex = (key: string) =>
      keyMappings.findIndex((keyMapping) => keyMapping.includes(key));

    window.addEventListener("keydown", (event) => {
      const mappingIndex = getMappingIndex(event.key);
      if (mappingIndex !== -1) {
        this.pressStates[mappingIndex] = true;
      }
    });
    window.addEventListener("keyup", (event) => {
      const mappingIndex = getMappingIndex(event.key);
      if (mappingIndex !== -1) {
        this.pressStates[mappingIndex] = false;
      }
    });
  }

  isKeyPressed(key: number) {
    if (key < 0 || key >= this.pressStates.length) {
      throw new Error("Key press lookup out of range.");
    }
    return this.pressStates[key];
  }
}
