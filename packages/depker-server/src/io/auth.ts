import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/config";
import IOError from "./IOError";
import { DefaultEventsMap, EventsMap } from "socket.io/dist/typed-events";

declare module "socket.io" {
  export class Socket<
    ListenEvents extends EventsMap = DefaultEventsMap,
    EmitEvents extends EventsMap = ListenEvents,
    ServerSideEvents extends EventsMap = DefaultEventsMap,
    SocketData = any
  > {
    jwt?: JwtPayload;
  }
}

export const auth = (socket: Socket, next: (err?: ExtendedError) => void) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (token) {
    jwt.verify(token.replace("Bearer ", ""), config.secret, (err, decoded) => {
      if (err) {
        next(new IOError("Decoded token invalid!", err));
      } else {
        socket.jwt = decoded;
        next();
      }
    });
  } else {
    next(new IOError("No token provided!"));
  }
};

export const sign = () => {
  return jwt.sign({ logged: true }, config.secret);
};
