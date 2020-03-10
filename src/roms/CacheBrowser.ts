type Cache = import("./Cache").Cache;

export class CacheBrowser implements Cache {
  read() {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  write() {}
}
