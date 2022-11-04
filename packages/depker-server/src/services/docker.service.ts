import { Injectable, Logger } from "@nestjs/common";
import Docker from "dockerode";
import { IS_DOCKER, NAMES } from "../constants/depker.constant";
import { AppStatus } from "../entities/app.entity";

@Injectable()
export class DockerService extends Docker {
  private readonly logger = new Logger(DockerService.name);

  constructor() {
    if (!IS_DOCKER) {
      super({
        protocol: "http",
        host: "127.0.0.1",
        port: "2375",
      });
    } else {
      super();
    }
  }

  public async initNetwork(name: string) {
    const networks = await this.listNetworks();
    const info = networks.find((n) => n.Name === name);
    let network: Docker.Network;
    if (info) {
      network = await this.getNetwork(info.Id);
    } else {
      this.logger.log(`Creating docker network ${name}.`);
      network = await this.createNetwork({
        Name: name,
        Driver: "bridge",
      });
    }
    return network;
  }

  public async depkerNetwork() {
    return await this.initNetwork(NAMES.NETWORK);
  }

  public async pullImage(name: string, force?: boolean) {
    if (force || !(await this.listImages()).find((i) => i.RepoTags?.includes(name))) {
      this.logger.log(`Pulling image ${name}.`);
      await new Promise<void>((resolve, reject) => {
        this.pull(name, {}, (error, output: NodeJS.ReadableStream) => {
          if (error) {
            this.logger.error(`Pull ${name} image error, ${error.message}`);
            reject(error);
            return;
          }
          output.on("data", (d) => {
            const data = JSON.parse(d);
            let message = "";
            if (data.id) {
              message += `${data.id}: `;
            }
            if (data.status) {
              message += `${data.status}`;
            }
            if (data.progress) {
              message += ` ${data.progress}`;
            }
            this.logger.debug(message);
          });
          output.on("end", () => {
            resolve();
          });
        });
      });
    }
  }

  public async listStatus(names: string[]) {
    const results: Record<string, AppStatus> = {};
    const infos = await this.listContainers({ all: true });
    for (const name of names) {
      const info = infos.find((i) => i.Names.includes(`/${name}`));
      if (info?.State === "running") {
        results[name] = "running";
      } else if (info?.State === "restarting") {
        results[name] = "restarting";
      } else if (info?.State === "exited") {
        results[name] = "exited";
      } else {
        results[name] = "stopped";
      }
    }
    return results;
  }
}
