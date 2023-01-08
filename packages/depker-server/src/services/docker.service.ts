import { Injectable, Logger } from "@nestjs/common";
import Docker, { ContainerCreateOptions } from "dockerode";
import { IS_DOCKER, NAMES } from "../constants/depker.constant";
import { ServiceStatus, ServiceType } from "../entities/service.entity";
import { PassThrough, Transform, TransformCallback } from "stream";
import { createInterface } from "readline";
import { stdcopy } from "../utils/docker.util";
import { DateTime } from "luxon";
import { Setting } from "../entities/setting.entity";

export class DockerContainers {
  constructor(private readonly docker: DockerService) {}

  public async list() {
    const infos = await this.docker.listContainers({ all: true });
    for (const info of infos) {
      // name
      const names = info.Names.find((n) => n.substring(1).indexOf("/") === -1);
      if (names) {
        info.Names = [names.substring(1)];
      } else {
        info.Names = [info.Names.map((n) => n.substring(1)).join(",")];
      }
      // state
      const state = info.State.toLowerCase();
      if (state === "running") {
        info.State = "running";
      } else if (state === "restarting") {
        info.State = "restarting";
      } else if (state === "exited") {
        info.State = "exited";
      } else {
        info.State = "stopped";
      }
    }
    return infos;
  }

  public get(name: string) {
    return this.docker.getContainer(name);
  }

  public async find(name: string) {
    const infos = await this.list();
    return infos.find((c) => c.Labels["depker.name"] === name && c.Names[0] === name);
  }

  public async start(name: string) {
    return await this.get(name).start();
  }

  public async stop(name: string) {
    return await this.get(name).stop();
  }

  public async restart(name: string) {
    return await this.get(name).restart();
  }

  public async kill(name: string) {
    return await this.get(name).kill();
  }

  public async rename(name: string, rename: string) {
    return await this.get(name).rename({ name: rename });
  }

  public async create(options: ContainerCreateOptions) {
    return await this.docker.createContainer(options);
  }

  public async remove(name: string, force?: boolean) {
    return await this.get(name).remove({ force });
  }

  public async inspect(name: string) {
    return await this.get(name).inspect();
  }

  public async status(data: { name: string; type: ServiceType }): Promise<ServiceStatus>;
  public async status(data: { name: string; type: ServiceType }[]): Promise<Record<string, ServiceStatus>>;
  public async status(
    data: { name: string; type: ServiceType } | { name: string; type: ServiceType }[]
  ): Promise<ServiceStatus | Record<string, ServiceStatus>> {
    const items = data instanceof Array ? data : [data];
    const results: Record<string, ServiceStatus> = {};
    const infos = await this.list();
    for (const { name, type } of items) {
      const info = infos.find((i) => i.Names[0] === name);
      if (type === "app") {
        if (info?.State) {
          results[name] = info.State as ServiceStatus;
        } else {
          results[name] = "stopped";
        }
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
      const container = this.get(name);

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
    const infos = await this.list();
    const containers = infos.filter((c) => c.Labels["depker.name"] === name && c.Names[0] !== name);
    for (const info of containers) {
      const container = this.get(info.Id);
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
    const infos = await this.list();
    const containers = infos.filter((c) => c.Labels["depker.name"] === name || c.Names[0] === name);
    for (const info of containers) {
      const container = this.get(info.Id);
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
    await this.docker.images.create(image);
    const through = new PassThrough({ encoding: "utf-8" });
    const readline = createInterface({ input: through });
    readline.on("line", (line) => lines(line));
    const [result] = await this.docker.run(image, commands, through, options);
    return result;
  }

  public async logs(name: string, tail?: number) {
    const container = this.get(name);
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
    const container = this.get(name);
    const exec = await container.exec({
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
    const container = this.get(name);
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

  public async prune() {
    await this.docker.pruneContainers();
  }
}

export class DockerImages {
  constructor(private readonly docker: DockerService) {}

  public async list() {
    return await this.docker.listImages();
  }

  public get(name: string) {
    return this.docker.getImage(name);
  }

  public async find(name: string) {
    const images = await this.list();
    return images.find((i) => i.RepoTags?.includes(name));
  }

  public async create(name: string, force?: boolean, lines?: (line: string) => void) {
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

  public async remove(name: string) {
    return await this.get(name).remove();
  }

  public async prune() {
    await this.docker.pruneImages();
  }
}

export class DockerNetworks {
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
    const infos = await this.list();
    return infos.find((n) => n.Name === name);
  }

  public async create(name: string) {
    const info = await this.find(name);
    if (info) {
      return this.docker.getNetwork(info.Id);
    } else {
      this.docker.logger.log(`Creating docker network ${name}.`);
      return await this.docker.createNetwork({ Name: name, Driver: "bridge" });
    }
  }

  public async remove(name: string) {
    return await this.get(name).remove();
  }

  public async connect(name: string, container: string) {
    return await this.get(name).connect({ Container: container });
  }

  public async disconnect(name: string, container: string) {
    return await this.get(name).disconnect({ Container: container, Force: true });
  }

  public async prune() {
    await this.docker.pruneNetworks();
  }
}

@Injectable()
export class DockerService extends Docker {
  public readonly logger = new Logger(DockerService.name);

  // values
  public readonly containers = new DockerContainers(this);
  public readonly images = new DockerImages(this);
  public readonly networks = new DockerNetworks(this);

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

  public async prune() {
    const setting = await Setting.read();
    if (setting.purge) {
      await Promise.all([this.pruneImages(), this.pruneVolumes(), this.pruneNetworks()]);
    }
  }
}
