import { Controller, OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Express } from "express";
// @ts-ignore
import cloudcmd from "cloudcmd";
import { Server } from "socket.io";
import { PATHS } from "../constants/depker.constant";
import { JwtStrategy } from "../guards/jwt.strategy";

@Controller("/files")
export class FileController implements OnModuleInit {
  constructor(private readonly adapter: HttpAdapterHost, private readonly jwts: JwtStrategy) {}

  public onModuleInit() {
    const app = this.adapter.httpAdapter.getInstance<Express>();
    const server = this.adapter.httpAdapter.getHttpServer();
    const socket = new Server({ path: "/files/socket.io" });
    socket.attach(server);
    app.use(
      "/files",
      (req, res, next) => {
        const tokens = req.headers.authorization?.split(" ");
        if (tokens && tokens.length === 2 && tokens[0] === "Basic") {
          const splitHash = Buffer.from(tokens[1], "base64").toString("utf8").split(":");
          const username = splitHash.shift();
          const password = splitHash.join(":");
          try {
            this.jwts.verify(password, username);
            return next();
          } catch (e: any) {
            // ignore
          }
        }
        return res
          .status(401)
          .header("Content-Type", "text/plain")
          .header("WWW-Authenticate", 'Basic realm="authorization needed"')
          .send("401 Unauthorized");
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
