import { ContainerOperation, ImageOperation, NetworkOperation, VolumeOperation } from "./results.type.ts";
import { DepkerRunner } from "./runner.type.ts";

export interface DepkerMaster extends DepkerRunner {
  container: ContainerOperation;
  network: NetworkOperation;
  volume: VolumeOperation;
  image: ImageOperation;
}
