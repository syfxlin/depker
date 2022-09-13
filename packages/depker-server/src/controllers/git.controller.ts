import { Controller, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { FetchData, Git, PushData } from "node-git-server";
import path from "path";
import { BASE_DIR } from "../constants/dir.constant";
import { SettingService } from "../services/setting.service";
import { HttpAdapterHost } from "@nestjs/core";
import { compareSync } from "bcrypt";
import { Express } from "express";
import { AppService } from "../services/app.service";

@Controller()
export class GitController {
  private readonly logger = new Logger(GitController.name);
  private readonly git: Git;

  constructor(
    private readonly adapter: HttpAdapterHost,
    private readonly settingService: SettingService,
    private readonly appService: AppService
  ) {
    this.git = new Git(path.join(BASE_DIR, "repos"), {
      autoCreate: true,
      authenticate: (options, next) => {
        options.user(async (username, password) => {
          try {
            const setting = await settingService.get();
            if (!username || !password || username !== setting.username || !compareSync(password, setting.password)) {
              next(new UnauthorizedException("Username or password do not match, please try again."));
              return;
            }

            const app = await appService.findByName(options.repo);
            if (!app) {
              next(new NotFoundException("Application not found, should be create before push."));
              return;
            }

            next();
          } catch (e) {
            this.logger.error(`Git authenticate error.`, e);
            next(e as Error);
          }
        });
      },
    });

    this.git.on("push", (data) => this.onPush(data));
    this.git.on("fetch", (data) => this.onFetch(data));

    const app = this.adapter.httpAdapter.getInstance<Express>();
    app.all("/repos/*", (req, res) => {
      req.url = req.url?.replace(/^\/repos\//, "/");
      this.git.handle(req, res);
    });
  }

  private onPush(data: PushData) {
    this.logger.log(`Push repository ${data.repo}/${data.commit} (${data.branch})`);
    data.accept();
  }

  private onFetch(data: FetchData) {
    this.logger.log(`Fetch repository ${data.repo}/${data.commit}`);
    data.accept();
  }
}
