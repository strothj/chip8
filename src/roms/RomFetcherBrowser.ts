type RomFetcher = import("./RomFetcher").RomFetcher;

export class RomFetcherBrowser implements RomFetcher {
  fetchRomLists() {
    return Promise.resolve([]);
  }

  fetchRomInfo() {
    return Promise.reject(new Error());
  }

  fetchRomBinary() {
    return Promise.reject(new Error());
  }
}
