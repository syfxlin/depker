import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions, Socket } from "socket.io";
import { INestApplication } from "@nestjs/common";
import { JwtStrategy } from "../guards/jwt.strategy";
import { ExtendedError } from "socket.io/dist/namespace";

export type WebSocketMiddleware = (socket: Socket, next: (err?: ExtendedError) => void, app: INestApplication) => void;

export type WebSocketOptions = ServerOptions & {
  namespace?: string;
  auth?: boolean;
};

export class WebSocketAdapter extends IoAdapter {
  constructor(private readonly app: INestApplication) {
    super(app);
  }

  public create(port: number, options?: WebSocketOptions): Server {
    const server = super.create(port, options);
    server.use(async (socket, next) => {
      if (!options?.auth) {
        next();
      } else {
        const jwt = this.app.get(JwtStrategy);
        try {
          jwt.$validate(socket.handshake.auth.token);
          next();
        } catch (e: any) {
          next(e);
        }
      }
    });
    return server;
  }

  public bindClientConnect(server: Server, callback: any) {
    super.bindClientConnect(server, callback);
  }

  public bindClientDisconnect(socket: Socket, callback: any) {
    super.bindClientDisconnect(socket, callback);
  }
}
