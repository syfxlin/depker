import { Server } from "socket.io";

export type SocketIOFn = (io: Server) => void;
