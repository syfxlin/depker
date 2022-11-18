import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { DockerService } from "../services/docker.service";
import { Socket } from "socket.io";

@WebSocketGateway({ namespace: "/containers/terminal" })
export class TerminalGateway implements OnGatewayConnection {
  constructor(private readonly docker: DockerService) {}

  public async handleConnection(socket: Socket) {
    const { name } = socket.handshake.auth;
    if (!name) {
      socket.emit("error", `Name must be not empty and is string.`);
      socket.disconnect();
      return;
    }
    try {
      const exec = await this.docker.getContainer(name).exec({
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Cmd: ["bash"],
        DetachKeys: "ctrl-q",
      });
      const duplex = await exec.start({ stdin: true, Tty: true });

      // input
      socket.on("data", (data: string) => {
        duplex.write(data);
      });
      // output
      duplex.on("data", (data: Buffer) => {
        socket.emit("data", data.toString("utf-8"));
      });

      // resize
      socket.on("resize", (data) => {
        exec.resize({ h: data.rows, w: data.cols });
      });

      // client close
      socket.on("disconnect", () => {
        duplex.write(String.fromCharCode(17));
      });

      // server close
      duplex.on("end", () => {
        socket.disconnect();
      });
    } catch (e: any) {
      if (e.statusCode === 404) {
        socket.emit("error", `Not found container of ${name}.`);
      } else {
        socket.emit("error", `Attach container ${name} has error ${e.message}.`);
      }
      socket.disconnect();
    }
  }
}
