import { useCallback, useRef, useState } from "react";
import { Clock, ClockSubscription } from "./Clock";
import { DisplayRef } from "./DisplayRef";
import { Keyboard } from "./Keyboard";
import { Memory } from "./Memory";
import { Processor } from "./Processor";
import { Speaker } from "./Speaker";

type UseSystemOptions = {
  rom: number[];
  getDisplay: () => DisplayRef;
};

type System = {
  processor: Processor;
  clock: Clock;
};

const TICK_INTERVAL_MS = 100;
const HERTZ = 500;
const CYCLES_PER_INTERVAL = HERTZ / (1000 / TICK_INTERVAL_MS);

export function useSystem({ rom, getDisplay }: UseSystemOptions) {
  const systemRef = useRef<System | null>(null);
  const clockSubscriptionRef = useRef<ClockSubscription | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const getSystem = useCallback(() => {
    if (!systemRef.current) {
      const memory = new Memory(new Uint8Array(rom));
      const display = getDisplay();
      const speaker = new Speaker();
      const keyboard = new Keyboard();
      const processor = new Processor(
        memory,
        display,
        speaker,
        keyboard /* , onDebugEmit */,
      );
      const clock = new Clock(TICK_INTERVAL_MS);
      systemRef.current = { processor, clock };
    }

    return systemRef.current;
  }, [getDisplay, rom]);

  const toggleRunning = useCallback(() => {
    if (clockSubscriptionRef.current) {
      clockSubscriptionRef.current.unsubscribe();
      clockSubscriptionRef.current = null;
      setIsRunning(false);
      return;
    }
    const system = getSystem();
    clockSubscriptionRef.current = system.clock.subscribe({
      next: () => {
        for (let i = 0; i < CYCLES_PER_INTERVAL; i += 1) {
          system.processor.performCycle();
        }
      },
      error: (error) => {
        console.error(error);
        clockSubscriptionRef.current = null;
        setIsRunning(false);
      },
    });
    setIsRunning(true);
  }, [getSystem]);

  return { isRunning, toggleRunning };
}
