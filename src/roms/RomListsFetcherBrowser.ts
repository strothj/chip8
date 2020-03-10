type RomListsFetcher = import("./RomListsFetcher").RomListsFetcher;

export class RomListsFetcherBrowser implements RomListsFetcher {
  fetchRomLists() {
    return Promise.resolve([]);
  }

  fetchRomInfo() {
    return Promise.reject(new Error());
  }
}
