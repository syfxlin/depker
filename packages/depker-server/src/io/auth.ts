import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import IOError from "./IOError";

export const auth = (socket: Socket, next: (err?: ExtendedError) => void) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (token) {
    jwt.verify(token.replace("Bearer ", ""), config.secret, (err, decoded) => {
      if (err) {
        next(new IOError("Decoded token invalid!", err));
      } else {
        // @ts-ignore
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
