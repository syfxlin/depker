import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { DockerService } from "../services/docker.service";
import { DateTime } from "luxon";
import { LogLevel } from "../types";

@WebSocketGateway({ namespace: "/containers/logs" })
export class LogsGateway implements OnGatewayConnection {
  constructor(private readonly docker: DockerService) {}

  public async handleConnection(socket: Socket) {
    const { name, tail = 1000 } = socket.handshake.auth;
    if (!name) {
      socket.emit("error", `Name must be not empty and is string.`);
      socket.disconnect();
      return;
    }
    try {
      const stream = await this.docker.containers.logs(name as string, parseInt(tail as string));

      // output
      stream.on("data", (data: [LogLevel, number, string]) => {
        socket.emit("data", data);
      });

      // client close
      socket.on("disconnect", () => {
        stream.destroy();
      });

      // server close
      stream.on("end", () => {
        socket.disconnect();
      });
    } catch (e: any) {
      if (e.statusCode === 404) {
        socket.emit("data", ["error", DateTime.utc().valueOf(), `Not found container of ${name}.`]);
      } else {
        socket.emit("data", ["error", DateTime.utc().valueOf(), `Logs container ${name} has error. ${e.message}`]);
      }
      socket.disconnect();
    }
  }
}
