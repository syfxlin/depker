import { Controller, OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Express } from "express";
// @ts-ignore
import cloudcmd from "cloudcmd";
import { Server } from "socket.io";
import { PATHS } from "../constants/depker.constant";
import { AuthService } from "../guards/auth.service";

@Controller("/api/files")
export class FileController implements OnModuleInit {
  constructor(private readonly adapter: HttpAdapterHost, private readonly auths: AuthService) {}

  public onModuleInit() {
    const app = this.adapter.httpAdapter.getInstance<Express>();
    const server = this.adapter.httpAdapter.getHttpServer();
    const socket = new Server({ path: "/api/files/socket.io" });
    socket.attach(server);
    app.use(
      "/api/files",
      async (request, response, next) => {
        try {
          await this.auths.request(request);
          return next();
        } catch (e: any) {
          return response
            .status(401)
            .header("Content-Type", "text/plain")
            .header("WWW-Authenticate", 'Basic realm="authorization needed"')
            .send("401 Unauthorized");
        }
      },
      ...cloudcmd({
        socket,
        config: {
          root: PATHS.ROOT,
          terminal: false,
          console: false,
          contact: false,
          configDialog: false,
          oneFilePanel: true,
          online: true,
        },
      })
    );
  }
}
