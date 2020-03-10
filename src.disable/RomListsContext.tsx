import React, {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

type RomEntry = {
	title: string;
	downloadRomUrl?: string;
	downloadInfoUrl?: string;
};

type Rom = {
	title: string;
	downloadRomUrl: string;
	downloadInfoUrl?: string;
	hashCode: string;
};

type RomList = {
	type: "demo" | "game";
	roms: Rom[];
};

type RomListsContextValue = {
	romLists: RomList[] | null;
	error: Error | null;
	getRomFromHashCode: (hashCode: string) => Rom | null;
};

type RomsListProviderProps = {
	children?: ReactNode;
};

const LOCAL_STORAGE_CACHE_KEY = "rom-list";

const RomListsContext = createContext<RomListsContextValue | null>(null);

function computeDownloadUrlHashCode(downloadUrl: string) {
	let hash = 0;
	for (let i = 0; i < downloadUrl.length; i += 1) {
		const char = downloadUrl.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash.toString();
}

async function fetchRomLists(): Promise<RomList[]> {
	const responses = await Promise.all(
		[
			{
				type: "demo" as "demo",
				url:
					"https://api.github.com/repos/dmatlack/chip8/contents/roms/demos",
			},
			{
				type: "game" as "game",
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
			files: (await response.json()) as { download_url: string | null }[],
		})),
	);
	const romLists = fileLists.map(({ type, files }) => ({
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
				const extension = filenameSegments[filenameSegments.length - 1];

				const title = decodeURIComponent(
					filenameSegments.slice(0, -1).join("."),
				);
				const rom: RomEntry = {
					...accumulator[title],
					title,
				};

				switch (extension) {
					case "ch8": {
						rom.downloadRomUrl = downloadUrl;
						break;
					}

					case "txt": {
						rom.downloadInfoUrl = downloadUrl;
						break;
					}

					default: {
						return accumulator;
					}
				}

				accumulator[title] = rom;
				return accumulator;
			}, {} as Record<string, RomEntry>),
		)
			.filter((rom): rom is Omit<Rom, "hashCode"> => !!rom.downloadRomUrl)
			.map(
				(rom): Rom => ({
					...rom,
					hashCode: computeDownloadUrlHashCode(rom.downloadRomUrl),
				}),
			),
	}));
	localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(romLists));
	return romLists;
}

export function RomListsProvider({ children }: RomsListProviderProps) {
	const [romLists, setRomLists] = useState<RomList[] | null>(() => {
		const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
		if (!cached) {
			return null;
		}
		return JSON.parse(cached);
	});
	const [error, setError] = useState<Error | null>(null);
	const [hashRomMap, setHashRomMap] = useState<Record<string, Rom>>({});

	useEffect(() => {
		if (romLists) {
			return;
		}
		let isCurrent = true;

		fetchRomLists()
			.then((romLists) => {
				const nextHasRomMap: Record<string, Rom> = {};
				romLists.forEach((romList) => {
					romList.roms.forEach((rom) => {
						nextHasRomMap[rom.hashCode] = rom;
					});
				});

				if (!isCurrent) {
					return;
				}
				setRomLists(romLists);
				setHashRomMap(nextHasRomMap);
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
	}, [romLists]);

	const getRomFromHashCode = useCallback(
		(hashCode: string) => {
			return hashRomMap[hashCode] || null;
		},
		[hashRomMap],
	);

	const value = useMemo(
		(): RomListsContextValue => ({
			romLists,
			error,
			getRomFromHashCode,
		}),
		[romLists, error],
	);

	return (
		<RomListsContext.Provider value={value}>
			{children}
		</RomListsContext.Provider>
	);
}

export function useRomLists() {
	const value = useContext(RomListsContext);
	if (!value) {
		throw new Error("RomListsContext used outside of its provider.");
	}
	return value;
}
