import { createStyles, makeStyles } from "@material-ui/core/styles";
import React, { useCallback, useRef } from "react";
import {
  createRomFetcher,
  Display,
  DisplayRef,
  Layout,
  RomBinary,
  useSystem,
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

export default function PlayerPage({ title, rom }: PlayerPageProps) {
  const classes = useStyles();
  const displayRef = useRef<DisplayRef>(null);
  const getDisplay = useCallback(() => {
    if (!displayRef.current) {
      throw new Error("Expected display reference to not be null.");
    }
    return displayRef.current;
  }, []);
  const { toggleRunning } = useSystem({ rom, getDisplay });

  return (
    <Layout title={title}>
      <div className={classes.wrapper}>
        <Display
          ref={displayRef}
          className={classes.display}
          onClick={toggleRunning}
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
      .map((rom): PlayerPageParamsObject => ({ params: { slug: rom.slug } })),
    fallback: false,
  };
}
