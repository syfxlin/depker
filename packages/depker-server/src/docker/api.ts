import Dockerode from "dockerode";
import { config } from "../config/config";
import { logger } from "../logger/server";
import { PullData } from "./ctx";

export class Docker extends Dockerode {
  public async initNetwork(name: string) {
    const networks = await docker.listNetworks();
    const info = networks.find((n) => n.Name === name);
    let network: Dockerode.Network;
    if (info) {
      network = await docker.getNetwork(info.Id);
    } else {
      logger.info(`Docker network ${name} does not exists, creating...`);
      network = await docker.createNetwork({
        Name: name,
        Driver: "bridge",
      });
    }
    return network;
  }

  public async depkerNetwork() {
    return await this.initNetwork(config.network);
  }

  public pullImage(tag: string) {
    return new Promise<void>((resolve, reject) => {
      this.pull(tag, {}, (error, output: NodeJS.ReadableStream) => {
        if (error) {
          logger.error(
            `Pull image error with tag: ${tag}, message: ${error.message}`
          );
          reject(error);
          return;
        }
        output.on("data", (d) => {
          logger.debug(JSON.parse(d) as PullData);
        });
        output.on("end", () => {
          resolve();
        });
      });
    });
  }
}

export const docker = new Docker(config.docker);
