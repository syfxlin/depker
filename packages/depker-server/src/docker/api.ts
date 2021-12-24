import Dockerode from "dockerode";
import { config } from "../config/config";
import { $logger } from "../logger/server";

export class Docker extends Dockerode {
  public async initNetwork(name: string) {
    const networks = await docker.listNetworks();
    const info = networks.find((n) => n.Name === name);
    let network: Dockerode.Network;
    if (info) {
      network = await docker.getNetwork(info.Id);
    } else {
      $logger.info(`Docker network ${name} does not exists, creating...`);
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
}

export const docker = new Docker(config.docker);
