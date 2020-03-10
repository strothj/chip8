import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useRomLists } from "./RomListsContext";

export function RomSelectScreen() {
	const { romLists } = useRomLists();

	return (
		<Fragment>
			<h1>Select rom</h1>
			{romLists!.map((romList) => (
				<Fragment key={romList.type}>
					<h2>{romList.type === "demo" ? "Demos" : "Games"}</h2>
					<ul>
						{romList.roms.map((rom) => (
							<li key={rom.hashCode}>
								<Link to={`/player?${rom.hashCode}`}>
									{rom.title}
								</Link>
								&nbsp;
								{rom.downloadInfoUrl && (
									<a href={rom.downloadInfoUrl}>[INFO]</a>
								)}
							</li>
						))}
					</ul>
				</Fragment>
			))}
		</Fragment>
	);
}
