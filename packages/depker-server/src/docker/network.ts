import { docker } from "./api";
import Dockerode from "dockerode";
import { config } from "../config/config";
import { $logger } from "../logger/server";

export const createNetwork = async (name: string) => {
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
};

export const depkerNetwork = async () => {
  return await createNetwork(config.network);
};
