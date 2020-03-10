import AppBar from "@material-ui/core/AppBar";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Head from "next/head";
import React, { ReactNode } from "react";

type LayoutProps = {
  children?: ReactNode;
  title: string;
};

const useStyles = makeStyles((theme) =>
  createStyles({
    appBarSpacer: theme.mixins.toolbar,
    content: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100%",
      overflow: "auto",
    },
  }),
);

export function Layout({ children, title: titleProp }: LayoutProps) {
  const classes = useStyles();
  const title = `Chip 8 - ${titleProp}`;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <AppBar>
        <Toolbar>
          <Typography variant="h6">{title}</Typography>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        {children}
      </main>
    </>
  );
}
