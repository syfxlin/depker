import { Depker } from "../depker.ts";
import { datetime, fs, getFileInfoType, isSubdir, osType, path, toPathString } from "../deps.ts";

interface CopyOptions {
  overwrite?: boolean;
  filter?: (path: string) => boolean;
}

interface IntCopyOptions extends CopyOptions {
  folder?: boolean;
}

export class UtiService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly depker: Depker) {}

  public kv(values: string | string[]): Record<string, string> {
    if (typeof values === "string") {
      if (values) {
        const split = values.split("=");
        const k = split.shift() as string;
        const v = split.join("=") as string;
        return { [k]: v };
      } else {
        return {};
      }
    } else {
      const results: Record<string, string> = {};
      for (const value of values) {
        if (value) {
          const split = value.split("=");
          const k = split.shift() as string;
          results[k] = split.join("=");
        }
      }
      return results;
    }
  }

  public short(value: string) {
    return value.substring(0, 10);
  }

  public bytes(value: number) {
    const units = [`B`, `KB`, `MB`, `GB`, `TB`, `PB`];
    while (value > 1024 && units.length > 1) {
      units.shift();
      value /= 1024;
    }
    return `${value.toFixed(2)} ${units[0]}`;
  }

  public date(value: string | number) {
    return datetime(value).toLocal().format("YYYY/MM/dd HH:mm:ss");
  }

  public async copy(source: string, target: string, options?: CopyOptions) {
    source = path.resolve(toPathString(source));
    target = path.resolve(toPathString(target));

    if (source === target) {
      throw new Error("Source and destination cannot be the same.");
    }

    const info = await Deno.lstat(source);
    if (info.isDirectory && isSubdir(source, target)) {
      throw new Error(`Cannot copy '${source}' to a subdirectory of itself, '${target}'.`);
    }

    if (info.isSymlink) {
      await this._copyLink(source, target, options);
    } else if (info.isDirectory) {
      await this._copyDir(source, target, options);
    } else if (info.isFile) {
      await this._copyFile(source, target, options);
    }
  }

  private async _validCopy(source: string, target: string, options?: IntCopyOptions): Promise<void> {
    let info: Deno.FileInfo | undefined = undefined;
    try {
      info = await Deno.lstat(target);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return;
      }
      throw err;
    }
    if (options?.folder && !info.isDirectory) {
      throw new Error(`Cannot overwrite non-directory '${source}' with directory '${target}'.`);
    }
    if (!options?.overwrite) {
      throw new Deno.errors.AlreadyExists(`'${target}' already exists.`);
    }
  }

  private async _copyLink(source: string, target: string, options?: IntCopyOptions) {
    if (options?.filter && !options.filter(source)) {
      return;
    }
    await this._validCopy(source, target, options);
    const origin = await Deno.readLink(source);
    const type = getFileInfoType(await Deno.lstat(source));
    if (osType === "windows") {
      await Deno.symlink(origin, target, { type: type === "dir" ? "dir" : "file" });
    } else {
      await Deno.symlink(origin, target);
    }
  }

  private async _copyDir(source: string, target: string, options?: IntCopyOptions) {
    if (options?.filter && !options.filter(source)) {
      return;
    }

    await this._validCopy(source, target, { ...options, folder: true });
    await fs.ensureDir(target);

    source = toPathString(source);
    target = toPathString(target);

    for await (const entry of Deno.readDir(source)) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, path.basename(sourcePath));
      if (entry.isSymlink) {
        await this._copyLink(sourcePath, targetPath, options);
      } else if (entry.isDirectory) {
        await this._copyDir(sourcePath, targetPath, options);
      } else if (entry.isFile) {
        await this._copyFile(sourcePath, targetPath, options);
      }
    }
  }

  private async _copyFile(source: string, target: string, options?: IntCopyOptions) {
    if (options?.filter && !options.filter(source)) {
      return;
    }
    await this._validCopy(source, target, options);
    await Deno.copyFile(source, target);
  }
}
