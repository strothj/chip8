import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

type RomEntry = {
	title: string;
	downloadRomUrl?: string;
	downloadInfoUrl?: string;
};

type Rom = Omit<RomEntry, "downloadRomUrl"> & {
	downloadRomUrl: string;
};

type RomList = {
	type: "demo" | "game";
	roms: Rom[];
};

const LOCAL_STORAGE_CACHE_KEY = "rom-list";

async function fetchRomLists() {
	const responses = await Promise.all(
		[
			{
				type: "demo" as const,
				url:
					"https://api.github.com/repos/dmatlack/chip8/contents/roms/demos",
			},
			{
				type: "game" as const,
				url:
					"https://api.github.com/repos/dmatlack/chip8/contents/roms/games",
			},
		].map(async ({ type, url }) => {
			const response = await fetch(url, {
				headers: { Accept: "application/vnd.github.v3+json" },
			});
			if (!response.ok) {
				throw new Error(
					`Rom list request failed: ${response.status}: ${response.statusText}`,
				);
			}
			return { type, response };
		}),
	);
	const fileLists = await Promise.all(
		responses.map(async ({ type, response }) => ({
			type,
			files: (await response.json()) as {
				download_url: string | null;
			}[],
		})),
	);
	const romLists = fileLists.map(
		({ type, files }): RomList => ({
			type,
			roms: Object.values(
				files.reduce((accumulator, { download_url: downloadUrl }) => {
					if (downloadUrl === null) {
						return accumulator;
					}
					const downloadUrlSegments = downloadUrl.split("/");
					const filename =
						downloadUrlSegments[downloadUrlSegments.length - 1];
					const filenameSegments = filename.split(".");
					const title = decodeURIComponent(
						filenameSegments.slice(0, -1).join("."),
					);
					const extension =
						filenameSegments[filenameSegments.length - 1];
					if (extension === "ch8") {
						accumulator[title] = {
							...accumulator[title],
							title: title,
							downloadRomUrl: downloadUrl,
						};
					} else if (extension === "txt") {
						accumulator[title] = {
							...accumulator[title],
							title: title,
							downloadInfoUrl: downloadUrl,
						};
					}
					return accumulator;
				}, {} as Record<string, RomEntry>),
			).filter((rom): rom is Rom => !!rom.downloadRomUrl),
		}),
	);
	localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(romLists));
	return romLists;
}

function useRomLists() {
	const [roms, setRoms] = useState<RomList[] | null>(() => {
		const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
		if (!cached) {
			return null;
		}
		return JSON.parse(cached);
	});
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (roms) {
			return;
		}
		let isCurrent = true;

		fetchRomLists()
			.then((romLists) => {
				if (!isCurrent) {
					return;
				}
				setRoms(romLists);
			})
			.catch((error) => {
				if (!isCurrent) {
					return;
				}
				setError(error);
			});

		return () => {
			isCurrent = false;
		};
	}, []);

	return { roms, error };
}

export function RomList() {
	const { roms, error } = useRomLists();

	if (error) {
		return <div>Failed to retrieve rom list: {error.message}</div>;
	}

	if (!roms) {
		return <div>Loading rom list...</div>;
	}

	const getRomClickHandler = (rom: Rom) => {
		return async () => {
			const response = await fetch(rom.downloadRomUrl);
			const responseBody = await response.blob();
			console.log(responseBody.size);
		};
	};

	return (
		<Fragment>
			<h1>Select rom</h1>
			{roms.map((romList) => (
				<Fragment key={romList.type}>
					<h2>{romList.type === "demo" ? "Demos" : "Games"}</h2>
					<ul>
						{romList.roms.map((rom) => (
							<li key={rom.title}>
								<button onClick={getRomClickHandler(rom)}>
									{rom.title}
								</button>
								{rom.downloadInfoUrl && (
									<Fragment>
										&nbsp;
										<a href={rom.downloadInfoUrl}>[INFO]</a>
									</Fragment>
								)}
							</li>
						))}
					</ul>
				</Fragment>
			))}
		</Fragment>
	);
}
