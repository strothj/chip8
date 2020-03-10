import fs from "fs";
import path from "path";

type Cache = import("./Cache").Cache;

export class CacheServer implements Cache {
  private readonly cacheDirectoryPath: string;

  constructor() {
    const cacheDirectoryPath = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDirectoryPath)) {
      fs.mkdirSync(cacheDirectoryPath);
    }
    this.cacheDirectoryPath = cacheDirectoryPath;
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
