export type RomMetaDataPartial = {
  downloadRomUrl?: string;
  downloadInfoUrl?: string;
};

export type RomMetaData = Omit<RomMetaDataPartial, "downloadRomUrl"> & {
  downloadRomUrl: string;
};

export type Rom = RomMetaData & {
  title: string;
  slug: string;
};

export type RomCategory = "demo" | "game";

export type RomList = {
  type: RomCategory;
  roms: Rom[];
  title: string;
};

export type RomInfo = {
  title: string;
  description: string;
};

export abstract class RomFetcher {
  abstract fetchRomLists(): Promise<RomList[]>;
  abstract fetchRomInfo(slug: string): Promise<RomInfo>;
}

export async function createRomFetcher() {
  let RomFetcherImpl: new () => RomFetcher;

  if (process.browser) {
    RomFetcherImpl = (await import("./RomFetcherBrowser")).RomFetcherBrowser;
  } else {
    RomFetcherImpl = (await import("./RomFetcherServer")).RomFetcherServer;
  }

  return new RomFetcherImpl();
}
