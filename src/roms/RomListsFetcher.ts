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

export abstract class RomListsFetcher {
  abstract fetchRomLists(): Promise<RomList[]>;
  abstract fetchRomInfo(slug: string): Promise<RomInfo>;
}

export function createRomListsFetcher() {
  let RomListsFetcherImpl: new () => RomListsFetcher;

  if (process.browser) {
    RomListsFetcherImpl = (require("./RomListsFetcherBrowser") as typeof import("./RomListsFetcherBrowser"))
      .RomListsFetcherBrowser;
  } else {
    RomListsFetcherImpl = (require("./RomListsFetcherServer") as typeof import("./RomListsFetcherServer"))
      .RomListsFetcherServer;
  }

  return new RomListsFetcherImpl();
}
