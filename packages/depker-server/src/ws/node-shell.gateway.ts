import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { DockerService } from "../services/docker.service";
import { Socket } from "socket.io";

@WebSocketGateway({ namespace: "/nodes/shell" })
export class NodeShellGateway implements OnGatewayConnection {
  constructor(private readonly docker: DockerService) {}

  public async handleConnection(socket: Socket) {
    // values
    const name = "node-shell";
    try {
      try {
        await this.docker.containers.remove(name);
      } catch (e) {
        // ignore
      }

      // create
      const container = await this.docker.containers.create({
        name: name,
        Image: "alpine:latest",
        Cmd: ["nsenter", "-t", "1", "-m", "-u", "-i", "-n", "sleep", "14000"],
        HostConfig: {
          PidMode: "host",
          IpcMode: "host",
          NetworkMode: "host",
          Privileged: true,
          AutoRemove: true,
          RestartPolicy: {
            Name: "no",
          },
        },
      });

      // start
      await container.start();

      // exec
      const [exec, duplex] = await this.docker.containers.exec(name, ["sh", "-c", "(zsh || bash || ash || sh)"]);

      // input
      socket.on("data", (data: string) => {
        duplex.write(data);
      });
      // output
      duplex.on("data", (data: Buffer) => {
        socket.emit("data", data.toString());
      });

      // resize
      socket.on("resize", (data) => {
        exec.resize({ h: data.rows, w: data.cols });
      });

      // client close
      socket.on("disconnect", async () => {
        duplex.write(String.fromCharCode(17));
        try {
          await container.remove({ force: true });
        } catch (e) {
          // ignore
        }
      });

      // server close
      duplex.on("end", async () => {
        socket.disconnect();
        try {
          await container.remove({ force: true });
        } catch (e) {
          // ignore
        }
      });
    } catch (e: any) {
      socket.emit("error", `Attach container ${name} has error ${e.message}.`);
      socket.disconnect();
      try {
        await this.docker.containers.remove(name);
      } catch (e) {
        // ignore
      }
    }
  }
}
