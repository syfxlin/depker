import {
  BuilderOperation,
  ContainerOperation,
  ImageOperation,
  NetworkOperation,
  VolumeOperation,
} from "../types/results.type.ts";
import { DepkerMaster } from "../types/master.type.ts";
import { Depker } from "../depker.ts";

export class OpsService implements DepkerMaster {
  constructor(private readonly depker: Depker) {}

  public get container(): ContainerOperation {
    return this.depker.master().container;
  }

  public get builder(): BuilderOperation {
    return this.depker.runner().builder;
  }

  public get network(): NetworkOperation {
    return this.depker.master().network;
  }

  public get volume(): VolumeOperation {
    return this.depker.master().volume;
  }

  public get image(): ImageOperation {
    return this.depker.master().image;
  }

  public async transfer(name: string, progress: (size: number | null) => void): Promise<void> {
    if (this.depker.master() != this.depker.runner()) {
      const size = { value: 0 };
      const save = this.depker.runner().builder.save(name).spawn();
      const load = this.depker.master().builder.load().spawn();
      const transform = new TransformStream<Uint8Array>({
        transform: (chunk, controller) => {
          size.value += chunk.length;
          progress(size.value);
          controller.enqueue(chunk);
        },
      });
      await save.stdout.pipeThrough(transform).pipeTo(load.stdin);
      await Promise.all([save.status, load.status]);
    }
    progress(null);
  }
}
