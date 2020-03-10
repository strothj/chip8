export abstract class Cache {
  abstract read<T extends object>(name: string): T | null;
  abstract write<T extends object>(name: string, data: T): void;
}

export async function createCache() {
  let CacheImpl: new () => Cache;

  if (process.browser) {
    CacheImpl = (require("./CacheBrowser") as typeof import("./CacheBrowser"))
      .CacheBrowser;
  } else {
    CacheImpl = (require("./CacheServer") as typeof import("./CacheServer"))
      .CacheServer;
  }

  return new CacheImpl();
}
