import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { DockerService } from "../services/docker.service";
import { stdcopy } from "../utils/docker.util";
import { DateTime } from "luxon";

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
      const container = this.docker.getContainer(name as string);
      const stream = await container.logs({
        stdout: true,
        stderr: true,
        timestamps: true,
        tail: tail ? parseInt(tail) : undefined,
        follow: true,
      });

      // output
      stream.on("data", (chunk: Buffer) => {
        const output = stdcopy(chunk);
        for (const [type, buffer] of output) {
          const level = type ? "error" : "log";
          const data = buffer.toString();
          const time = data.substring(0, 30);
          const line = data.substring(31).replace("\n", "");
          socket.emit("data", [level, DateTime.fromISO(time).valueOf(), line]);
        }
      });

      // client close
      socket.on("disconnect", () => {
        // @ts-ignore
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
