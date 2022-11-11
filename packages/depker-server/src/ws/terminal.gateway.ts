import { OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { DockerService } from "../services/docker.service";
import { Server, Socket } from "socket.io";
import { BadRequestException } from "@nestjs/common";

@WebSocketGateway({
  namespace: "/terminal",
  cors: { origin: "*" },
})
export class TerminalGateway implements OnGatewayInit {
  constructor(private readonly docker: DockerService) {}

  public afterInit(server: Server) {
    server.use((socket, next) => {
      const { name } = socket.handshake.query;
      if (!name) {
        next(new BadRequestException(`name, commands must be not empty.`));
      } else {
        next();
      }
    });
    server.on("connect", async (socket: Socket) => {
      const { name } = socket.handshake.query;
      try {
        const exec = await this.docker.getContainer(name as string).exec({
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
          socket.disconnect(true);
        });
      } catch (e: any) {
        if (e.statusCode === 404) {
          socket.emit("error", `Not found container of ${name}.`);
        } else {
          socket.emit("error", `Attach container ${name} has error ${e.message}.`);
        }
        socket.disconnect(true);
      }
    });
  }
}
