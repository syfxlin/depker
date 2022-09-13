import { Injectable } from "@nestjs/common";
import path from "path";
import os from "os";
import { simpleGit } from "simple-git";
import { Build } from "../entities/build.entity";
import { BASE_DIR } from "../constants/dir.constant";
import fs from "fs-extra";

@Injectable()
export class StorageService {
  public async project(build: Build): Promise<string> {
    const app = build.app;
    const name = app.name;
    const commit = build.commit;
    const src = path.join(BASE_DIR, "repos", `${name}.git`);
    const dst = path.join(os.tmpdir(), `${name}-${build.id}-dir`);

    fs.removeSync(dst);
    fs.ensureDirSync(dst);
    const git = simpleGit(dst);
    await git.clone(src, ".");
    await git.checkout(commit);
    return dst;
  }

  public async secrets(build: Build): Promise<string> {
    const app = build.app;
    const name = app.name;
    const secrets = app.secrets.filter((s) => s.onbuild);
    const dst = path.join(os.tmpdir(), `${name}-${build.id}-env`);

    const values = secrets.map((s) => `${s.name}=${s.value}`).join("\n");
    fs.removeSync(dst);
    fs.outputFileSync(dst, `${values}\n`);
    return dst;
  }
}
