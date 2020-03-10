import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import InfoIcon from "@material-ui/icons/Info";
import clsx from "clsx";
import Link from "next/link";
import React, { Fragment, useState } from "react";
import { createRomFetcher, Layout, RomList } from "../src";

type RomSelectPageProps = {
  romLists: RomList[];
};

const useStyles = makeStyles((theme) =>
  createStyles({
    nested: {
      paddingLeft: theme.spacing(4),
    },
    hidden: {
      display: "none",
    },
  }),
);

export default function RomSelectPage({ romLists }: RomSelectPageProps) {
  const [categoryOpenStates, setCategoryOpenStates] = useState(() =>
    romLists.reduce((accumulator, romList) => {
      accumulator[romList.type] = true;
      return accumulator;
    }, {} as Record<string, boolean>),
  );
  const classes = useStyles();

  const getCollapseButtonHandler = (romListType: string) => {
    return () => {
      setCategoryOpenStates((prevCategoryOpenStates) => ({
        ...prevCategoryOpenStates,
        [romListType]: !prevCategoryOpenStates[romListType],
      }));
    };
  };

  return (
    <Layout title="Select Rom">
      <List dense>
        {romLists.map((romList) => (
          <Fragment key={romList.type}>
            <ListItem button onClick={getCollapseButtonHandler(romList.type)}>
              <ListItemText primary={romList.title} />
              {categoryOpenStates[romList.type] ? (
                <ExpandLess />
              ) : (
                <ExpandMore />
              )}
            </ListItem>
            <List
              className={clsx({
                [classes.hidden]: !categoryOpenStates[romList.type],
              })}
              component="div"
              dense
              disablePadding
            >
              {romList.roms.map((rom) => (
                <Link key={rom.slug} href={`/player/${rom.slug}`} passHref>
                  <ListItem className={classes.nested} component="a" button>
                    <ListItemText primary={rom.title} />
                    <ListItemSecondaryAction>
                      {rom.downloadInfoUrl && (
                        <Link href={`/info/${rom.slug}`} passHref>
                          <IconButton
                            component="a"
                            edge="end"
                            aria-label="rom details"
                          >
                            <InfoIcon />
                          </IconButton>
                        </Link>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                </Link>
              ))}
            </List>
          </Fragment>
        ))}
      </List>
    </Layout>
  );
}

export async function getStaticProps() {
  const romFetcher = await createRomFetcher();
  const romLists = await romFetcher.fetchRomLists();
  const props: RomSelectPageProps = { romLists };
  return { props };
}
