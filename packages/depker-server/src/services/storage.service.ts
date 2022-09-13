import { Injectable } from "@nestjs/common";
import path from "path";
import os from "os";
import { simpleGit } from "simple-git";
import { Deploy } from "../entities/deploy.entity";
import { BASE_DIR } from "../constants/dir.constant";
import fs from "fs-extra";

@Injectable()
export class StorageService {
  public async project(deploy: Deploy): Promise<string> {
    const app = deploy.app;
    const name = app.name;
    const commit = deploy.commit;
    const src = path.join(BASE_DIR, "repos", `${name}.git`);
    const dst = path.join(os.tmpdir(), `${name}-${deploy.id}-dir`);

    fs.removeSync(dst);
    fs.ensureDirSync(dst);
    const git = simpleGit(dst);
    await git.clone(src, ".");
    await git.checkout(commit);
    return dst;
  }

  public async secrets(deploy: Deploy): Promise<string> {
    const app = deploy.app;
    const name = app.name;
    const secrets = app.secrets.filter((s) => s.onbuild);
    const dst = path.join(os.tmpdir(), `${name}-${deploy.id}-env`);

    const values = secrets.map((s) => `${s.name}=${s.value}`).join("\n");
    fs.removeSync(dst);
    fs.outputFileSync(dst, `${values}\n`);
    return dst;
  }
}
