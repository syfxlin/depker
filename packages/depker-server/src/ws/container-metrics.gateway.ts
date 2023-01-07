import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { DockerService } from "../services/docker.service";
import { Socket } from "socket.io";

@WebSocketGateway({ namespace: "/containers/metrics" })
export class ContainerMetricsGateway implements OnGatewayConnection {
  constructor(private readonly docker: DockerService) {}

  public async handleConnection(socket: Socket) {
    const { name } = socket.handshake.auth;
    if (!name) {
      socket.emit("error", `Name must be not empty and is string.`);
      socket.disconnect();
      return;
    }

    const flag = { value: true };

    // client close
    socket.on("disconnect", () => {
      flag.value = false;
    });

    // loop
    const loop = async () => {
      try {
        while (flag.value) {
          const stats = await this.docker.containers.stats(name as string);
          socket.emit("data", stats);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (e: any) {
        if (e.statusCode === 404) {
          socket.emit("error", `Not found container of ${name}.`);
        } else {
          socket.emit("error", `Stats container ${name} has error ${e.message}.`);
        }
        flag.value = false;
        socket.disconnect();
      }
    };
    loop();
  }
}
