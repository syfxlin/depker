import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions, Socket } from "socket.io";
import { INestApplication } from "@nestjs/common";
import { AuthService } from "../guards/auth.service";
import { Request } from "express";

export type WebSocketOptions = ServerOptions & {
  namespace?: string;
  auth?: boolean;
};

export class WebSocketAdapter extends IoAdapter {
  constructor(private readonly app: INestApplication) {
    super(app);
  }

  public create(port: number, options: WebSocketOptions): Server {
    return super.create(port, {
      ...options,
      cors: { origin: "*", ...options.cors },
      allowRequest: async (request, next) => {
        if (options?.auth === false) {
          next(null, true);
        } else {
          const auth = this.app.get(AuthService);
          try {
            await auth.request(request as Request);
            next(null, true);
          } catch (e: any) {
            next(e, false);
          }
        }
      },
    });
  }

  public bindClientConnect(server: Server, callback: any) {
    super.bindClientConnect(server, callback);
  }

  public bindClientDisconnect(socket: Socket, callback: any) {
    super.bindClientDisconnect(socket, callback);
  }
}
