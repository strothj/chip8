import { createStyles, makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() =>
  createStyles({
    "@global": {
      "html, body, #__next": {
        height: "100%",
      },
    },
  }),
);

export function GlobalStyles() {
  useStyles();

  return null;
}
