type Cache = import("./Cache").Cache;

export class CacheBrowser implements Cache {
  read() {
    return null;
  }

  write() {}
}
