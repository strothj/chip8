import { createStyles, makeStyles } from "@material-ui/core/styles";
import React, { useRef, useState } from "react";
import {
  createRomFetcher,
  Display,
  DisplayRef,
  Layout,
  RomBinary,
  system,
} from "../../src";

type PlayerPageParamsObject = {
  params: {
    slug: string;
  };
};

type PlayerPageProps = RomBinary;

const useStyles = makeStyles((theme) =>
  createStyles({
    wrapper: {
      flex: 1,
      position: "relative",
      padding: theme.spacing(3),
      maxHeight: "calc(100vh - 64px)",
    },
    display: {
      width: "100%",
      height: "100%",
    },
  }),
);

export default function PlayerPage({ title, rom: romProp }: PlayerPageProps) {
  const classes = useStyles();
  const displayRef = useRef<DisplayRef>(null);

  const [handleDisplayClick] = useState(() => {
    const display = new Proxy(
      {},
      {
        get: (_target, property) => {
          return displayRef.current![property as keyof DisplayRef];
        },
      },
    ) as DisplayRef;

    const TICK_INTERVAL_MS = 100;
    const HERTZ = 500;
    const CYCLES_PER_INTERVAL = HERTZ / (1000 / TICK_INTERVAL_MS);

    const rom = new Uint8Array(romProp);
    const memory = new system.Memory(rom);
    const speaker = new system.Speaker();
    const keyboard = new system.Keyboard();
    const processor = new system.Processor(
      memory,
      display,
      speaker,
      keyboard,
      // (data) => {
      //   console.log(data);
      // },
    );
    const clock = new system.Clock(TICK_INTERVAL_MS);
    let clockSubscription: system.ClockSubscription | null = null;

    return () => {
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
    };
  });

  return (
    <Layout title={title}>
      <div className={classes.wrapper}>
        <Display
          ref={displayRef}
          className={classes.display}
          onClick={handleDisplayClick}
        />
      </div>
    </Layout>
  );
}

export async function getStaticProps({
  params: { slug },
}: PlayerPageParamsObject): Promise<{ props: PlayerPageProps }> {
  const romFetcher = await createRomFetcher();
  const romBinary = await romFetcher.fetchRomBinary(slug);
  return { props: romBinary };
}

export async function getStaticPaths() {
  const romFetcher = await createRomFetcher();
  const romLists = await romFetcher.fetchRomLists();

  return {
    paths: romLists
      .map((romList) => romList.roms)
      .flat(1)
      .filter((rom) => !!rom.downloadInfoUrl)
      .map((rom): PlayerPageParamsObject => ({ params: { slug: rom.slug } })),
    fallback: false,
  };
}
