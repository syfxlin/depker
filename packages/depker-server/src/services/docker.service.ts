import { Injectable, Logger } from "@nestjs/common";
import Docker, { ContainerCreateOptions } from "dockerode";
import { IS_DOCKER, NAMES } from "../constants/depker.constant";
import { ServiceStatus, ServiceType } from "../entities/service.entity";
import { PassThrough, Transform, TransformCallback } from "stream";
import { createInterface } from "readline";
import { stdcopy } from "../utils/docker.util";
import { DateTime } from "luxon";
import { Setting } from "../entities/setting.entity";

export class DockerContainer {
  constructor(private readonly docker: DockerService) {}

  public async list() {
    return await this.docker.listContainers({ all: true });
  }

  public get(name: string) {
    return this.docker.getContainer(name);
  }

  public async find(name: string) {
    const infos = await this.findAll(name);
    return infos.find((c) => this._names(c.Names) === name);
  }

  public async findAll(name: string) {
    const infos = await this.docker.listContainers({ all: true });
    return infos.filter((c) => c.Labels["depker.name"] === name);
  }

  public async start(name: string) {
    return await this.docker.getContainer(name).start();
  }

  public async stop(name: string) {
    return await this.docker.getContainer(name).stop();
  }

  public async restart(name: string) {
    return await this.docker.getContainer(name).restart();
  }

  public async kill(name: string) {
    return await this.docker.getContainer(name).kill();
  }

  public async rename(name: string, rename: string) {
    return await this.docker.getContainer(name).rename({ name: rename });
  }

  public async create(options: ContainerCreateOptions) {
    return await this.docker.createContainer(options);
  }

  public async remove(name: string, force?: boolean) {
    return await this.docker.getContainer(name).remove({ force });
  }

  public async inspect(name: string) {
    return await this.docker.getContainer(name).inspect();
  }

  public async status(data: { name: string; type: ServiceType }): Promise<ServiceStatus>;
  public async status(data: { name: string; type: ServiceType }[]): Promise<Record<string, ServiceStatus>>;
  public async status(
    data: { name: string; type: ServiceType } | { name: string; type: ServiceType }[]
  ): Promise<ServiceStatus | Record<string, ServiceStatus>> {
    const items = data instanceof Array ? data : [data];
    const results: Record<string, ServiceStatus> = {};
    const infos = await this.docker.listContainers({ all: true });
    for (const { name, type } of items) {
      const info = infos.find((i) => this._names(i.Names) === name);
      if (type === "app") {
        results[name] = this._status(info?.State);
      } else {
        if (info) {
          results[name] = "running";
        } else {
          results[name] = "stopped";
        }
      }
    }
    return data instanceof Array ? results : results[data.name];
  }

  public async stats(name: string) {
    try {
      const container = this.docker.getContainer(name);

      // metrics
      const stats = await container.stats({ stream: false });
      const cpu_delta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const system_cpu_delta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const number_cpus = stats.cpu_stats.online_cpus;
      const cpu = (cpu_delta / system_cpu_delta) * number_cpus * 100;
      const memory = stats.memory_stats.usage - stats.memory_stats.stats.cache;
      const input = Object.values(stats.networks).reduce((a, i) => a + i.rx_bytes, 0);
      const output = Object.values(stats.networks).reduce((a, i) => a + i.tx_bytes, 0);

      // processes
      const processes = await container.top();

      return {
        cpu: {
          free: 100 - cpu,
          used: cpu,
          total: 100,
        },
        memory: {
          free: stats.memory_stats.limit - memory,
          used: memory,
          total: stats.memory_stats.limit,
        },
        network: {
          input,
          output,
        },
        process: {
          titles: processes.Titles,
          processes: processes.Processes,
        },
      };
    } catch (e: any) {
      return {
        cpu: {
          free: 0,
          used: 0,
          total: 1,
        },
        memory: {
          free: 0,
          used: 0,
          total: 1,
        },
        network: {
          input: 0,
          output: 0,
        },
        process: {
          titles: [],
          processes: [],
        },
      };
    }
  }

  public async purge(name: string) {
    const infos = await this.docker.listContainers({ all: true });
    const containers = infos.filter((c) => c.Labels["depker.name"] === name && this._names(c.Names) !== name);
    for (const info of containers) {
      const container = this.docker.getContainer(info.Id);
      try {
        await container.remove({ force: true });
      } catch (e: any) {
        if (e.statusCode === 404) {
          continue;
        }
        this.docker.logger.error(`Purge container ${container.id} failed.`, e);
      }
    }
  }

  public async clean(name: string) {
    const infos = await this.docker.listContainers({ all: true });
    const containers = infos.filter((c) => c.Labels["depker.name"] === name || this._names(c.Names) === name);
    for (const info of containers) {
      const container = this.docker.getContainer(info.Id);
      try {
        await container.remove({ force: true });
      } catch (e: any) {
        if (e.statusCode === 404) {
          continue;
        }
        this.docker.logger.error(`Clean container ${container.id} failed.`, e);
      }
    }
  }

  public async run(image: string, commands: string[], lines: (line: string) => void, options: ContainerCreateOptions) {
    await this.docker.images.pull(image);
    const through = new PassThrough({ encoding: "utf-8" });
    const readline = createInterface({ input: through });
    readline.on("line", (line) => lines(line));
    const [result] = await this.docker.run(image, commands, through, options);
    return result;
  }

  public async logs(name: string, tail?: number) {
    const container = this.docker.getContainer(name as string);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      timestamps: true,
      follow: true,
      tail: tail,
    });
    const transform = new Transform({
      objectMode: true,
      transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const output = stdcopy(chunk);
        for (const [type, buffer] of output) {
          const level = type ? "error" : "log";
          const data = buffer.toString();
          const time = data.substring(0, 30);
          const line = data.substring(31).replace("\n", "");
          callback(null, [level, DateTime.fromISO(time).valueOf(), line]);
        }
      },
    });
    return stream.pipe(transform);
  }

  public async exec(name: string, commands: string[]) {
    const exec = await this.docker.getContainer(name).exec({
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: commands,
      DetachKeys: "ctrl-q",
    });
    const duplex = await exec.start({ stdin: true, Tty: true });
    return [exec, duplex] as const;
  }

  public async print(name: string) {
    const container = this.docker.getContainer(name as string);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      timestamps: true,
      follow: false,
    });
    const output = stdcopy(stream as unknown as Buffer);
    return output.map(([type, buffer]) => {
      const level = type ? "error" : "log";
      const data = buffer.toString();
      const time = data.substring(0, 30);
      const line = data.substring(31).replace("\n", "");
      return [level, DateTime.fromISO(time).valueOf(), line] as const;
    });
  }

  public _names(names: string[]) {
    for (const full of names) {
      const name = full.substring(1);
      if (name.indexOf("/") === -1) {
        return name;
      }
    }
    return names.join(",");
  }

  public _status(state: string | undefined) {
    if (state === "running") {
      return "running";
    } else if (state === "restarting") {
      return "restarting";
    } else if (state === "exited") {
      return "exited";
    } else {
      return "stopped";
    }
  }
}

export class DockerImage {
  constructor(private readonly docker: DockerService) {}

  public async list() {
    return await this.docker.listImages();
  }

  public get(name: string) {
    return this.docker.getImage(name);
  }

  public async find(name: string) {
    const images = await this.docker.listImages();
    return images.find((i) => i.RepoTags?.includes(name));
  }

  public async remove(name: string) {
    return await this.docker.getImage(name).remove();
  }

  public async pull(name: string, force?: boolean, lines?: (line: string) => void) {
    if (force || !(await this.find(name))) {
      this.docker.logger.log(`Pulling image ${name}.`);
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(name, {}, (error, output: NodeJS.ReadableStream) => {
          if (error) {
            this.docker.logger.error(`Pull ${name} image error, ${error.message}`);
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
            this.docker.logger.debug(message);
            lines?.(message);
          });
          output.on("end", () => {
            resolve();
          });
        });
      });
    }
    return name;
  }
}

export class DockerNetwork {
  constructor(private readonly docker: DockerService) {}

  public async depker() {
    return this.create(NAMES.NETWORK);
  }

  public async list() {
    return await this.docker.listNetworks();
  }

  public get(name: string) {
    return this.docker.getNetwork(name);
  }

  public async find(name: string) {
    const infos = await this.docker.listNetworks();
    return infos.find((n) => n.Name === name);
  }

  public async create(name: string) {
    const infos = await this.docker.listNetworks();
    const info = infos.find((n) => n.Name === name);
    if (info) {
      return this.docker.getNetwork(info.Id);
    } else {
      this.docker.logger.log(`Creating docker network ${name}.`);
      return await this.docker.createNetwork({ Name: name, Driver: "bridge" });
    }
  }

  public async remove(name: string) {
    return await this.docker.getNetwork(name).remove();
  }

  public async connect(name: string, container: string) {
    return await this.docker.getNetwork(name).connect({ Container: container });
  }

  public async disconnect(name: string, container: string) {
    return await this.docker.getNetwork(name).disconnect({ Container: container, Force: true });
  }
}

@Injectable()
export class DockerService extends Docker {
  public readonly logger = new Logger(DockerService.name);

  // values
  public readonly containers = new DockerContainer(this);
  public readonly images = new DockerImage(this);
  public readonly networks = new DockerNetwork(this);

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

  public async purge() {
    const setting = await Setting.read();
    if (setting.purge) {
      await Promise.all([this.pruneImages(), this.pruneVolumes()]);
    }
  }
}
