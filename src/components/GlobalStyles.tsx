// import React from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() =>
  createStyles({
    "@global": {
      "html, body": {
        height: "100%",
      },
      "#__next": {
        minHeight: "100%",
      },
    },
  }),
);

export function GlobalStyles() {
  useStyles();

  return null;
}
