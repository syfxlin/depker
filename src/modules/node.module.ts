import hash from "../deps/npm/hash.ts";
import { Depker } from "../depker.ts";
import {
  BuilderOperation,
  ContainerOperation,
  DepkerMaster,
  ImageOperation,
  NetworkOperation,
  VolumeOperation,
} from "../providers/types.ts";

export class NodeModule implements DepkerMaster {
  constructor(private readonly depker: Depker) {}

  public get id() {
    const master = this.depker.master();
    const runner = this.depker.runner();
    return hash([master.id, runner.id]);
  }

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
    const master = this.depker.master();
    const runner = this.depker.runner();
    if (master.id !== runner.id) {
      const size = { value: 0 };
      const save = runner.builder.save(name).spawn();
      const load = master.builder.load().spawn();
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
