import CssBaseline from "@material-ui/core/CssBaseline";
import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";
import { PlayerScreen } from "./PlayerScreen";
import { RomListsProvider } from "./RomListsContext";
import { RomSelectScreen } from "./RomSelectScreen";

export function App() {
	return (
		<RomListsProvider>
			<CssBaseline />
			<LoadingScreen>
				<HashRouter>
					<Switch>
						<Route path="/" exact component={RomSelectScreen} />
						<Route path="/player" component={PlayerScreen} />
					</Switch>
				</HashRouter>
			</LoadingScreen>
		</RomListsProvider>
	);
}
