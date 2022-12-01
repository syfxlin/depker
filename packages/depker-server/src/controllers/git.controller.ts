import { Controller, Logger } from "@nestjs/common";
import { FetchData, Git, PushData } from "node-git-server";
import { HttpAdapterHost } from "@nestjs/core";
import { Express } from "express";
import { PATHS } from "../constants/depker.constant";
import { Service } from "../entities/service.entity";
import { AuthService } from "../guards/auth.service";

@Controller("/api/repos")
export class GitController {
  private readonly logger = new Logger(GitController.name);
  private readonly git: Git;

  constructor(private readonly adapter: HttpAdapterHost, private readonly auths: AuthService) {
    const app = this.adapter.httpAdapter.getInstance<Express>();
    this.git = new Git(PATHS.REPOS, { autoCreate: true });

    this.git.on("push", (data) => this.onPush(data));
    this.git.on("fetch", (data) => this.onFetch(data));

    app.all("/api/repos/*", async (request, response) => {
      // authenticate
      try {
        await this.auths.request(request);
      } catch (e: any) {
        return response
          .status(401)
          .header("Content-Type", "text/plain")
          .header("WWW-Authenticate", 'Basic realm="authorization needed"')
          .send("401 Unauthorized");
      }
      // find service
      const match = request.url?.match(/^\/api\/repos\/([^/]+)\/.+/);
      if (!match) {
        return response
          .status(400)
          .header("Content-Type", "text/plain")
          .send("Service not found, should be create before push.");
      }
      const count = await Service.countBy({ name: match[1] });
      if (!count) {
        return response
          .status(400)
          .header("Content-Type", "text/plain")
          .send("Service not found, should be create before push.");
      }
      // git server
      request.url = request.url?.replace(/^\/api\/repos\//, "/");
      this.git.handle(request, response);
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
