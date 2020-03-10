import fs from "fs";
import path from "path";

type Cache = import("./Cache").Cache;

export class CacheServer implements Cache {
  private readonly cacheDirectoryPath: string;

  constructor() {
    let previousDirectoryPath = "";
    let directoryPath = __dirname;
    while (previousDirectoryPath !== directoryPath) {
      if (fs.existsSync(path.join(directoryPath, "package.json"))) {
        this.cacheDirectoryPath = path.join(directoryPath, "cache");
        return;
      }
      previousDirectoryPath = directoryPath;
      directoryPath = path.resolve(directoryPath, "..");
    }
    throw new Error("Unable to resolve cache directory.");
  }

  private getFilePath(name: string) {
    return path.join(this.cacheDirectoryPath, `${name}.json`);
  }

  read<T extends object>(name: string) {
    try {
      const value = JSON.parse(fs.readFileSync(this.getFilePath(name), "utf8"));
      return value as T;
    } catch {
      return null;
    }
  }

  write<T extends object>(name: string, data: T) {
    fs.writeFileSync(
      this.getFilePath(name),
      JSON.stringify(data, null, 2),
      "utf8",
    );
  }
}
