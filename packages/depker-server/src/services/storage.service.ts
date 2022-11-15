import { Injectable } from "@nestjs/common";
import path from "path";
import os from "os";
import fs from "fs-extra";
import { PATHS } from "../constants/depker.constant";
import { randomUUID } from "crypto";
import git from "nodegit";

@Injectable()
export class StorageService {
  public async repository(name: string) {
    const target = path.join(PATHS.REPOS, `${name}.git`);
    if (!fs.pathExistsSync(target)) {
      return undefined;
    }
    return await git.Repository.open(target);
  }

  public async project(name: string, id: string) {
    const source = path.join(PATHS.REPOS, `${name}.git`);
    const target = path.join(os.tmpdir(), `${name}-${randomUUID()}`);
    fs.removeSync(target);
    if (fs.pathExistsSync(target)) {
      await git.Clone.clone(source, target);
      const repo = await git.Repository.open(source);
      const commit = await repo.getCommit(id);
      repo.setHeadDetached(commit.id());
    } else {
      fs.ensureDirSync(target);
    }
    return target;
  }

  public async dir(name: string) {
    const target = path.join(os.tmpdir(), `${name}-${randomUUID()}`);
    fs.removeSync(target);
    return target;
  }

  public async file(name: string) {
    const target = path.join(os.tmpdir(), `${name}-${randomUUID()}`);
    fs.removeSync(target);
    return target;
  }
}
