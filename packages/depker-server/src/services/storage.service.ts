import { Injectable } from "@nestjs/common";
import path from "path";
import os from "os";
import { simpleGit } from "simple-git";
import fs from "fs-extra";
import { PATHS } from "../constants/depker.constant";
import { randomUUID } from "crypto";

@Injectable()
export class StorageService {
  public async git(name: string) {
    const target = path.join(PATHS.REPOS, `${name}.git`);
    if (!fs.pathExistsSync(target)) {
      return undefined;
    }
    return simpleGit(target);
  }

  public async project(name: string, ref: string) {
    const source = path.join(PATHS.REPOS, `${name}.git`);
    const target = path.join(os.tmpdir(), `${name}-${randomUUID()}`, `project`);
    fs.removeSync(target);
    fs.ensureDirSync(target);
    const git = simpleGit(source);
    await git.clone(source, ".");
    await git.checkout(ref);
    return target;
  }

  public async file(name: string, file: string, data: string) {
    const target = path.join(os.tmpdir(), `${name}-${randomUUID()}`, file);
    fs.removeSync(target);
    fs.outputFileSync(target, data);
    return target;
  }
}
