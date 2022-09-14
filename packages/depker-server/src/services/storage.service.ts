import { Injectable } from "@nestjs/common";
import path from "path";
import os from "os";
import { simpleGit } from "simple-git";
import { Deploy } from "../entities/deploy.entity";
import fs from "fs-extra";
import { ROOT_DIR } from "../constants/depker.constant";

@Injectable()
export class StorageService {
  public async project(deploy: Deploy): Promise<string> {
    const app = deploy.app;
    const name = app.name;
    const commit = deploy.commit;
    const src = path.join(ROOT_DIR, `repos`, `${name}.git`);
    const dst = path.join(os.tmpdir(), `${name}-${deploy.id}`, `project`);

    fs.removeSync(dst);
    fs.ensureDirSync(dst);
    const git = simpleGit(dst);
    await git.clone(src, ".");
    await git.checkout(commit);
    return dst;
  }

  public async file(deploy: Deploy, key: string, data: string): Promise<string> {
    const app = deploy.app;
    const name = app.name;
    const dst = path.join(os.tmpdir(), `${name}-${deploy.id}`, key);

    fs.removeSync(dst);
    fs.outputFileSync(dst, data);
    return dst;
  }
}
