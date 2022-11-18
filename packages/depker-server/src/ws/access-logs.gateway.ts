import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { Tail } from "tail";
import path from "path";
import { PATHS } from "../constants/depker.constant";
import fs from "fs-extra";

@WebSocketGateway({ namespace: "/logs" })
export class AccessLogsGateway implements OnGatewayConnection {
  public async handleConnection(socket: Socket) {
    const { tail = 1000 } = socket.handshake.auth;
    const file = path.join(PATHS.CONFIG, "traefik-access.log");
    if (!fs.pathExistsSync(file)) {
      socket.emit("error", `Access Logs is empty.`);
      socket.disconnect();
      return;
    }
    const watch = new Tail(file, { nLines: tail, flushAtEOF: true, useWatchFile: true });
    watch.on("line", (data: string) => {
      socket.emit("data", data);
    });

    // server close
    watch.on("error", (error: Error) => {
      socket.emit("error", error.message ?? error);
      socket.disconnect();
    });

    // client close
    socket.on("disconnect", () => {
      watch.unwatch();
    });
  }
}
