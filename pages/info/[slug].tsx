import Container from "@material-ui/core/Container";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import React from "react";
import { createRomListsFetcher, Layout, RomInfo } from "../../src";

type RomInfoPageParamsObject = {
  params: {
    slug: string;
  };
};

type RomInfoPageProps = RomInfo;

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(3),
    },
    code: {
      display: "block",
      fontSize: "16px",
      whiteSpace: "pre-wrap",
    },
  }),
);

export default function RomInfoPage({ title, description }: RomInfoPageProps) {
  const classes = useStyles();

  return (
    <Layout title={title}>
      <Container className={classes.container}>
        <code className={classes.code}>{description}</code>
      </Container>
    </Layout>
  );
}

export async function unstable_getStaticProps({
  params: { slug },
}: RomInfoPageParamsObject): Promise<{ props: RomInfoPageProps }> {
  const romListsFetcher = createRomListsFetcher();
  const romInfo = await romListsFetcher.fetchRomInfo(slug);
  return { props: romInfo };
}

export async function unstable_getStaticPaths() {
  const romListsFetcher = createRomListsFetcher();
  const romLists = await romListsFetcher.fetchRomLists();

  return {
    paths: romLists
      .map((romList) => romList.roms)
      .flat(1)
      .filter((rom) => !!rom.downloadInfoUrl)
      .map((rom): RomInfoPageParamsObject => ({ params: { slug: rom.slug } })),
  };
}
