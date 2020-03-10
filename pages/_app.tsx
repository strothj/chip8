import CssBaseline from "@material-ui/core/CssBaseline";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import App from "next/app";
import Head from "next/head";
import React, { StrictMode } from "react";
import { GlobalStyles } from "../src";

const theme = createMuiTheme({
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
});

export default class CustomApp extends App {
  componentDidMount() {
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement!.removeChild(jssStyles);
    }
  }

  render() {
    const { Component, pageProps } = this.props;

    return (
      <StrictMode>
        <MuiThemeProvider theme={theme}>
          <Head>
            <meta
              name="viewport"
              content="minimum-scale=1, initial-scale=1, width=device-width"
            />
          </Head>
          <CssBaseline />
          <GlobalStyles />
          <Component {...pageProps} />
        </MuiThemeProvider>
      </StrictMode>
    );
  }
}
