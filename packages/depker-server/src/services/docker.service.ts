import { Injectable, Logger } from "@nestjs/common";
import Docker from "dockerode";
import { ConfigService } from "@nestjs/config";
import { IN_DOCKER } from "../constants/docker.constant";
import { DEPKER_NETWORK } from "../constants/depker.constant";

@Injectable()
export class DockerService extends Docker {
  private readonly logger = new Logger(DockerService.name);

  constructor(config: ConfigService) {
    const docker = config.get<string>(IN_DOCKER) ?? "true";
    if (docker === "false") {
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
    return await this.initNetwork(DEPKER_NETWORK);
  }

  public async pullImage(tag: string, force?: boolean) {
    if (force || (await this.listImages()).find((i) => i.RepoTags?.includes(tag))) {
      this.logger.log(`Pulling image ${tag}.`);
      await new Promise<void>((resolve, reject) => {
        this.pull(tag, {}, (error, output: NodeJS.ReadableStream) => {
          if (error) {
            this.logger.error(`Pull ${tag} image error, ${error.message}`);
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
}
