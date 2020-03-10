import fetch from "isomorphic-unfetch";
import slug from "slug";
import { createCache } from "./Cache";

type RomFetcher = import("./RomFetcher").RomFetcher;
type RomList = import("./RomFetcher").RomList;
type RomCategory = import("./RomFetcher").RomCategory;
type RomMetaDataPartial = import("./RomFetcher").RomMetaDataPartial;
type RomMetaData = import("./RomFetcher").RomMetaData;
type Rom = import("./RomFetcher").Rom;
type RomInfo = import("./RomFetcher").RomInfo;
type RomBinary = import("./RomFetcher").RomBinary;

type GithubFile = {
  download_url: string | null;
};

type CachedRomInfo = Pick<RomInfo, "description">;

type CachedRomBinary = {
  rom: number[];
};

const romCategoryContentsUrlMap: Record<RomCategory, string> = {
  demo: "https://api.github.com/repos/dmatlack/chip8/contents/roms/demos",
  game: "https://api.github.com/repos/dmatlack/chip8/contents/roms/games",
};

const categoryTitleMap: Record<RomCategory, string> = {
  demo: "Demos",
  game: "Games",
};

function computeRomSlug(type: RomCategory, title: string) {
  return slug(`${type} ${title}`).toLowerCase();
}

function parseRomsFromGithubFiles(type: RomCategory, files: GithubFile[]) {
  const titleRomMetaDataPartialMap = files.reduce(
    (accumulator, { download_url: downloadUrl }) => {
      if (downloadUrl === null) {
        return accumulator;
      }

      const downloadUrlSegments = downloadUrl.split("/");
      const filename = downloadUrlSegments[downloadUrlSegments.length - 1];
      const filenameSegments = filename.split(".");
      const title = decodeURIComponent(filenameSegments.slice(0, -1).join("."));
      const fileExtension = filenameSegments[filenameSegments.length - 1];

      if (fileExtension === "ch8") {
        accumulator[title] = {
          ...accumulator[title],
          downloadRomUrl: downloadUrl,
        };
      } else if (fileExtension === "txt") {
        accumulator[title] = {
          ...accumulator[title],
          downloadInfoUrl: downloadUrl,
        };
      }
      return accumulator;
    },
    {} as Record<string, RomMetaDataPartial>,
  );

  const roms = Object.entries(titleRomMetaDataPartialMap)
    .filter(
      (entry): entry is [string, RomMetaData] => !!entry[1].downloadRomUrl,
    )
    .map(
      ([title, metaData]): Rom => ({
        ...metaData,
        title,
        slug: computeRomSlug(type, title),
      }),
    );
  return roms;
}

export class RomFetcherServer implements RomFetcher {
  private readonly cacheInitialization = createCache();

  private assertResponseOk(response: Response) {
    if (response.ok) {
      return;
    }
    throw new Error(
      `Request failed: ${response.status}: ${response.statusText}`,
    );
  }

  async fetchRomLists() {
    const cache = await this.cacheInitialization;
    const cacheKey = "rom-lists";
    const cachedRomLists = cache.read<RomList[]>(cacheKey);
    if (cachedRomLists) {
      return cachedRomLists;
    }

    const responses = await Promise.all(
      Object.entries(romCategoryContentsUrlMap).map(
        async ([typeString, url]) => {
          const type = typeString as RomCategory;
          const response = await fetch(url, {
            headers: { Accept: "application/vnd.github.v3+json" },
          });
          this.assertResponseOk(response);
          return { type, response };
        },
      ),
    );

    const fileLists = await Promise.all(
      responses.map(async ({ type, response }) => ({
        type,
        files: (await response.json()) as GithubFile[],
      })),
    );

    const romLists = fileLists.map(
      ({ type, files }): RomList => ({
        type,
        roms: parseRomsFromGithubFiles(type, files),
        title: categoryTitleMap[type],
      }),
    );

    cache.write(cacheKey, romLists);
    return romLists;
  }

  private async getRomBySlug(slug: string) {
    const romLists = await this.fetchRomLists();
    const rom = romLists
      .map((romList) => romList.roms)
      .flat(1)
      .find((rom) => rom.slug === slug);
    if (!rom) {
      throw new Error(`Failed to locate rom corresponding to slug: ${slug}`);
    }
    return rom;
  }

  async fetchRomInfo(slug: string): Promise<RomInfo> {
    const cache = await this.cacheInitialization;
    const rom = await this.getRomBySlug(slug);
    if (!rom.downloadInfoUrl) {
      throw new Error(`Rom does not contain an info download url: ${slug}`);
    }

    const title = rom.title;
    const cacheKey = `rom-info-${slug}`;
    let cachedRomInfo = cache.read<CachedRomInfo>(cacheKey);
    if (cachedRomInfo) {
      return { ...cachedRomInfo, title };
    }

    const response = await fetch(rom.downloadInfoUrl);
    this.assertResponseOk(response);
    cachedRomInfo = { description: await response.text() };
    cache.write(cacheKey, cachedRomInfo);

    return { ...cachedRomInfo, title };
  }

  async fetchRomBinary(slug: string): Promise<RomBinary> {
    const cache = await this.cacheInitialization;
    const rom = await this.getRomBySlug(slug);
    const title = rom.title;
    const cacheKey = `rom-binary-${slug}`;
    const cachedRomBinary = cache.read<CachedRomBinary>(cacheKey);
    if (cachedRomBinary) {
      return { ...cachedRomBinary, title };
    }

    const response = await fetch(rom.downloadRomUrl);
    this.assertResponseOk(response);
    const romBytes = new Uint8Array(await response.arrayBuffer());
    cache.write<CachedRomBinary>(cacheKey, { rom: [...romBytes] });
    return { title, rom: [...romBytes] };
  }
}
