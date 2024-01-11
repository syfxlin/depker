import {
  ContainerCopyOptions,
  ContainerExecOptions,
  ContainerInspect,
  ContainerKillOptions,
  ContainerLogsOptions,
  ContainerRemoveOptions,
  ContainerStartOptions,
  ContainerStatsOptions,
  ContainerStopOptions,
  ContainerTopOptions,
} from "../../services/run/types.ts";
import { command } from "../../deps.ts";
import { Depker, DepkerModule } from "../../depker.ts";
import { PackContext } from "./pack.context.ts";
import { ServiceConfig } from "./service.type.ts";
import { ProxyModule } from "../proxy/proxy.module.ts";

declare global {
  interface DepkerApp {
    service(config: ServiceConfig): DepkerApp;
  }
}

type PruneSelect = "all" | "pre";

type ActiveSelect = "active" | "latest" | string;

type AllSelect = "active" | "latest" | "inactive" | "all" | string;

class PruneSelectType extends command.EnumType<PruneSelect> {
  constructor() {
    super(["all", "pre"]);
  }
}

class ActiveSelectType extends command.EnumType<ActiveSelect> {
  constructor() {
    super(["active", "latest", "<container>"]);
  }

  public parse(type: command.ArgumentValue): "active" | "latest" | string {
    return type.value;
  }
}

class AllSelectType extends command.EnumType<AllSelect> {
  constructor() {
    super(["active", "latest", "inactive", "all", "<container>"]);
  }

  public parse(type: command.ArgumentValue): "active" | "latest" | "inactive" | "all" | string {
    return type.value;
  }
}

export class ServiceModule implements DepkerModule {
  public static readonly NAME = "service";
  private readonly depker: Depker;
  private readonly services: Array<ServiceConfig>;

  constructor(depker: Depker) {
    this.depker = depker;
    this.services = [];
    this.depker.inject(ServiceModule.NAME, () => this.register.bind(this));
    this.depker.dependency(ProxyModule.NAME, () => new ProxyModule(depker));
  }

  public get name() {
    return ServiceModule.NAME;
  }

  public async init() {
    const service = new command.Command().description("Manage services").alias("service").alias("svc").default("list");
    this._deploy(service);
    this._list(service);
    this._inspect(service);
    this._start(service);
    this._stop(service);
    this._kill(service);
    this._remove(service);
    this._rename(service);
    this._prune(service);
    this._exec(service);
    this._logs(service);
    this._top(service);
    this._stats(service);
    this._copy(service);
    this._wait(service);
    this.depker.cli.command("services", service);

    this._deploy(this.depker.cli);
    this._list(this.depker.cli);
    this._inspect(this.depker.cli);
    this._start(this.depker.cli);
    this._stop(this.depker.cli);
    this._kill(this.depker.cli);
    this._remove(this.depker.cli);
    this._rename(this.depker.cli);
    this._prune(this.depker.cli);
    this._exec(this.depker.cli);
    this._logs(this.depker.cli);
    this._top(this.depker.cli);
    this._stats(this.depker.cli);
    this._copy(this.depker.cli);
    this._wait(this.depker.cli);
  }

  // region public functions

  public register(...configs: Array<ServiceConfig>): void {
    this.services.push(...configs);
  }

  public select(items: Array<ContainerInspect>, select: AllSelect): Array<ContainerInspect> {
    const inputs = [...items].sort((a, b) => b.Name.localeCompare(a.Name));
    if (select === "latest") {
      return [inputs[0]];
    } else if (select === "all") {
      return [...inputs];
    } else if (select === "active") {
      const clone: Array<ContainerInspect> = [...inputs];
      while (clone.length !== 0) {
        const inspect = clone.shift() as ContainerInspect;
        const status = inspect.State.Status.toLowerCase();
        const health = inspect.State.Health?.Status?.toLowerCase();
        if (status === "running" && (!health || health === "healthy")) {
          return [inspect];
        }
      }
      return [inputs[0]];
    } else if (select === "inactive") {
      const clone: Array<ContainerInspect> = [...inputs];
      const outputs: Array<ContainerInspect> = [];
      while (clone.length !== 0) {
        const item = clone.shift() as ContainerInspect;
        const status = item.State.Status.toLowerCase();
        const health = item.State.Health?.Status?.toLowerCase();
        if (status === "running" && (!health || health === "healthy")) {
          break;
        }
        if (clone.length === 0) {
          outputs.shift();
        }
        outputs.push(item);
      }
      while (clone.length !== 0) {
        const item = clone.shift() as ContainerInspect;
        outputs.push(item);
      }
      return outputs;
    } else {
      const outputs: Array<ContainerInspect> = [];
      for (const item of inputs) {
        if (select === item.Id || select === item.Name || (select.length > 7 && item.Id.startsWith(select))) {
          outputs.push(item);
          break;
        }
      }
      return outputs;
    }
  }

  public async deploy(...configs: Array<string | ServiceConfig>): Promise<void> {
    if (configs.length) {
      for (const config of configs) {
        if (typeof config === "string") {
          const service = this.services.find((s) => s.name === config);
          if (service) {
            await PackContext.create(this.depker, service).execute();
          }
        } else if (config) {
          await PackContext.create(this.depker, config).execute();
        }
      }
    } else {
      for (const service of this.services) {
        await PackContext.create(this.depker, service).execute();
      }
    }
  }

  public async list(names: string[] = [], select?: AllSelect): Promise<Record<string, Array<ContainerInspect>>> {
    const infos = await this.depker.ops.container.list();
    const insps = await this.depker.ops.container.inspect(infos.map((i) => i.Id));
    const services: Record<string, Array<ContainerInspect>> = {};
    for (const insp of insps) {
      const exec = /^([a-zA-Z0-9][a-zA-Z0-9_.-]*)-i(\d+)$/.exec(insp.Name);
      const name = exec ? exec[1] : insp.Name;
      if (!names.length || names.includes(name)) {
        services[name] = services[name] ?? [];
        services[name].push(insp);
        services[name].sort((a, b) => b.Name.localeCompare(a.Name));
      }
    }
    const inspects: Record<string, Array<ContainerInspect>> = {};
    for (const [name, items] of Object.entries(services)) {
      const selected = this.select(items, select ?? "all");
      if (selected.length) {
        inspects[name] = selected;
      }
    }
    return inspects;
  }

  public async start(names: string[], select?: AllSelect, options?: ContainerStartOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map((i) => i.Id));
    }
    if (ids.length) {
      await this.depker.ops.container.start(ids, options);
    }
  }

  public async stop(names: string[], select?: AllSelect, options?: ContainerStopOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map((i) => i.Id));
    }
    if (ids.length) {
      await this.depker.ops.container.stop(ids, options);
    }
  }

  public async kill(names: string[], select?: AllSelect, options?: ContainerKillOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map((i) => i.Id));
    }
    if (ids.length) {
      await this.depker.ops.container.kill(ids, options);
    }
  }

  public async remove(names: string[], select?: AllSelect, options?: ContainerRemoveOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map((i) => i.Id));
    }
    if (ids.length) {
      await this.depker.ops.container.remove(ids, options);
    }
  }

  public async rename(name: string, rename: string, select?: AllSelect): Promise<void> {
    for (const infos of Object.values(await this.list([name], select))) {
      for (const info of infos) {
        const exec = /^([a-zA-Z0-9][a-zA-Z0-9_.-]*)-i(\d+)$/.exec(info.Name);
        if (exec) {
          await this.depker.ops.container.rename(info.Id, `${rename}-i${exec[2]}`);
        } else {
          await this.depker.ops.container.rename(info.Id, rename);
        }
      }
    }
  }

  public async copy(source: string, target: string, select?: ActiveSelect, options?: ContainerCopyOptions) {
    const sources = source.split(":");
    const targets = target.split(":");
    if (sources.length > 1) {
      const inspect = await this.list([sources[0]], select ?? "active").then((a) => a[sources[0]]?.[0]);
      sources[0] = inspect.Id;
    }
    if (targets.length > 1) {
      const inspect = await this.list([targets[0]], select ?? "active").then((a) => a[targets[0]]?.[0]);
      targets[0] = inspect.Id;
    }
    // prettier-ignore
    await this.depker.ops.container
      .copy(sources.join(":"), targets.join(":"), options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  public async prune(select?: PruneSelect, options?: ContainerRemoveOptions) {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list())) {
      const outputs: string[] = [];
      while (infos.length !== 0) {
        const info = infos.shift() as ContainerInspect;
        const status = info.State.Status.toLowerCase();
        const health = info.State.Health?.Status?.toLowerCase();
        if (status === "running" && (!health || health === "healthy")) {
          break;
        }
        if (infos.length === 0) {
          outputs.shift();
        }
        if (select !== "pre") {
          outputs.push(info.Id);
        }
      }
      while (infos.length !== 0) {
        const info = infos.shift() as ContainerInspect;
        outputs.push(info.Id);
      }
      ids.push(...outputs);
    }
    if (ids.length) {
      await this.depker.ops.container.remove(ids, {
        Force: true,
        Link: options?.Link,
        Volumes: options?.Volumes,
      });
    }
  }

  public async wait(names: string[], select?: AllSelect): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map((i) => i.Id));
    }
    if (ids.length) {
      await this.depker.ops.container.wait(ids);
    }
  }

  public async logs(name: string, select?: ActiveSelect, options?: ContainerLogsOptions) {
    const inspect = await this.list([name], select ?? "active").then((a) => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}`);
    }
    // prettier-ignore
    await this.depker.ops.container
      .logs(inspect.Id, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  public async top(name: string, select?: ActiveSelect, options?: ContainerTopOptions) {
    const inspect = await this.list([name], select ?? "active").then((a) => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}`);
    }
    // prettier-ignore
    await this.depker.ops.container
      .top(inspect.Id, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  public async stats(name: string, select?: ActiveSelect, options?: ContainerStatsOptions) {
    const inspect = await this.list([name], select ?? "active").then((a) => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}`);
    }
    // prettier-ignore
    await this.depker.ops.container
      .stats(inspect.Id, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  public async exec(name: string, commands: string[], select?: ActiveSelect, options?: ContainerExecOptions) {
    const inspect = await this.list([name], select ?? "active").then((a) => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}`);
    }
    // prettier-ignore
    await this.depker.ops.container
      .exec(inspect.Id, commands, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  // endregion

  // region private commands

  private _deploy(cmd: command.Command) {
    cmd
      .command("deploy [name...:string]", "Deploy services")
      .alias("dep")
      .action(async (_options, ...names) => {
        await this.deploy(...names);
      });
  }

  private _list(cmd: command.Command) {
    cmd
      .command("list [name...:string]", "List services")
      .alias("ls")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .option("-f, --format <format:string>", "Pretty-print using nunjucks template")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, ...names) => {
        const infos = Object.entries(await this.list(names, options.select)).map((e) => ({ Name: e[0], Items: e[1] }));
        if (options.format) {
          this.depker.log.render(options.format, infos);
        } else if (options.json) {
          this.depker.log.json(infos);
        } else if (options.yaml) {
          this.depker.log.yaml(infos);
        } else {
          const header = ["Name", "Activated", "Status", "Image", "CreatedAt", "Containers"];
          const body = infos.map((info) => {
            const item = this.select(info.Items, "active")[0] ?? this.select(info.Items, "latest")[0];
            // prettier-ignore
            return [
              `${info.Name}`,
              `${item.Name}`,
              `${item.State.Status}${item.State?.Health?.Status ? ` (${item.State?.Health?.Status})` : ``}`,
              `${item.Config.Image}`,
              `${this.depker.log.date(item.Created)}`,
              `${info.Items.map((i) => `${i.Name} [${i.State.Status}${i.State?.Health?.Status ? ` (${i.State?.Health?.Status})` : ``}]`).join("\n")}`,
            ];
          });
          this.depker.log.table(header, body);
        }
      });
  }

  private _inspect(cmd: command.Command) {
    cmd
      .command("inspect <name...:string>", "Display detailed information on one or more services")
      .alias("is")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .option("-f, --format <format:string>", "Pretty-print using nunjucks template")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, ...names) => {
        const infos = Object.entries(await this.list(names, options.select)).map((e) => ({ Name: e[0], Items: e[1] }));
        if (options.format) {
          this.depker.log.render(options.format, infos);
        } else if (options.json) {
          this.depker.log.json(infos);
        } else {
          this.depker.log.yaml(infos);
        }
      });
  }

  private _start(cmd: command.Command) {
    cmd
      .command("start <name...:string>", "Start one or more stopped services")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .option("-i, --interactive", "Attach service's STDIN")
      .option("-a, --attach", "Attach STDOUT/STDERR and forward signals")
      .action(async (options, ...names) => {
        this.depker.log.step(`Starting services started.`);
        try {
          const opts: ContainerStartOptions = {};
          if (options.interactive !== undefined) {
            opts.Interactive = options.interactive;
          }
          if (options.attach !== undefined) {
            opts.Attach = options.attach;
          }
          await this.start(names, options.select, opts);
          this.depker.log.done(`Starting services successfully.`);
        } catch (e) {
          this.depker.log.error(`Starting services failed.`, e);
        }
      });
  }

  private _stop(cmd: command.Command) {
    cmd
      .command("stop <name...:string>", "Stop one or more running services")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .option("-t, --time <time:integer>", "Seconds to wait for stop before killing the service")
      .option("-i, --signal <signal:string>", "Signal to send to the service")
      .action(async (options, ...names) => {
        this.depker.log.step(`Stopping services started.`);
        try {
          const opts: ContainerStopOptions = {};
          if (options.time !== undefined) {
            opts.Time = String(options.time);
          }
          if (options.signal !== undefined) {
            opts.Signal = options.signal;
          }
          await this.stop(names, options.select, opts);
          this.depker.log.done(`Stopping services successfully.`);
        } catch (e) {
          this.depker.log.error(`Stopping services failed.`, e);
        }
      });
  }

  private _kill(cmd: command.Command) {
    cmd
      .command("kill <name...:string>", "Kill one or more running services")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .option("-i, --signal <signal:string>", "Signal to send to the service")
      .action(async (options, ...names) => {
        this.depker.log.step(`Killing services started.`);
        try {
          const opts: ContainerKillOptions = {};
          if (options.signal !== undefined) {
            opts.Signal = options.signal;
          }
          await this.kill(names, options.select, opts);
          this.depker.log.done(`Killing services successfully.`);
        } catch (e) {
          this.depker.log.error(`Killing services failed.`, e);
        }
      });
  }

  private _remove(cmd: command.Command) {
    cmd
      .command("remove <name...:string>", "Remove one or more services")
      .alias("rm")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .option("-f, --force", "Force the removal of a running service")
      .option("-l, --link", "Remove the specified link")
      .option("-v, --volumes", "Remove anonymous volumes associated with the service")
      .action(async (options, ...names) => {
        this.depker.log.step(`Removing services started.`);
        try {
          const opts: ContainerRemoveOptions = {};
          if (options.force !== undefined) {
            opts.Force = options.force;
          }
          if (options.link !== undefined) {
            opts.Link = options.link;
          }
          if (options.volumes !== undefined) {
            opts.Volumes = options.volumes;
          }
          await this.remove(names, options.select, opts);
          this.depker.log.done(`Removing services successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing services failed.`, e);
        }
      });
  }

  private _rename(cmd: command.Command) {
    cmd
      .command("rename <name:string> <rename:string>", "Rename a service")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .action(async (options, name, rename) => {
        this.depker.log.step(`Renaming services started.`);
        try {
          await this.rename(name, rename, options.select);
          this.depker.log.done(`Renaming services successfully.`);
        } catch (e) {
          this.depker.log.error(`Renaming services failed.`, e);
        }
      });
  }

  private _prune(cmd: command.Command) {
    cmd
      .command("prune", "Remove all abnormal services")
      .type("select", new PruneSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .option("-f, --force", "Force the removal of stopped service")
      .option("-l, --link", "Remove the specified link")
      .option("-v, --volumes", "Remove anonymous volumes associated with the service")
      .action(async (options) => {
        this.depker.log.step(`Pruning services started.`);
        try {
          await this.prune(options.select as PruneSelect, {
            Link: options.link,
            Volumes: options.volumes,
          });
          this.depker.log.done(`Pruning services successfully.`);
        } catch (e) {
          this.depker.log.error(`Pruning services failed.`, e);
        }
      });
  }

  private _exec(cmd: command.Command) {
    cmd
      .command("exec <name:string> <commands...:string>", "Run a command in a running service")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "active" })
      .option("-t, --tty", "Allocate a pseudo-TTY")
      .option("-d, --detach", "Override the key sequence for detaching a service")
      .option("-i, --interactive", "Keep STDIN open even if not attached")
      .option("-p, --privileged", "Give extended privileges to the command")
      .option("-u, --user <user:string>", "Username or UID (format: <name|uid>[:<group|gid>])")
      .option("-w, --workdir <dir:string>", "Working directory inside the service")
      .action(async (options, name, ...commands) => {
        const opts: ContainerExecOptions = {};
        if (options.tty !== undefined) {
          opts.Tty = options.tty;
        }
        if (options.detach !== undefined) {
          opts.Detach = options.detach;
        }
        if (options.interactive !== undefined) {
          opts.Interactive = options.interactive;
        }
        if (options.privileged !== undefined) {
          opts.Privileged = options.privileged;
        }
        if (options.user !== undefined) {
          opts.User = options.user;
        }
        if (options.workdir !== undefined) {
          opts.Workdir = options.workdir;
        }
        await this.exec(name, commands, options.select, opts);
      });
  }

  private _logs(cmd: command.Command) {
    cmd
      .command("logs <name:string>", "Fetch the logs of a service")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "active" })
      .option("-d, --details", "Show extra details provided to logs")
      .option("-f, --follow", "Follow log output")
      .option("-t, --timestamps", "Show timestamps")
      .option("-n, --tail <tail:string>", "Number of lines to show from the end of the logs")
      .option("-l, --since <since:string>", "Show logs since timestamp")
      .option("-r, --until <until:string>", "Show logs before a timestamp")
      .action(async (options, name) => {
        const opts: ContainerLogsOptions = {};
        if (options.details !== undefined) {
          opts.Details = options.details;
        }
        if (options.follow !== undefined) {
          opts.Follow = options.follow;
        }
        if (options.timestamps !== undefined) {
          opts.Timestamps = options.timestamps;
        }
        if (options.tail !== undefined) {
          opts.Tail = options.tail;
        }
        if (options.since !== undefined) {
          opts.Since = options.since;
        }
        if (options.until !== undefined) {
          opts.Until = options.until;
        }
        await this.logs(name, options.select, opts);
      });
  }

  private _top(cmd: command.Command) {
    cmd
      .command("top <name:string>", "Display the running processes of a service")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "active" })
      .option("-o, --options <options:string>", "Input ps options")
      .action(async (options, name) => {
        const opts: ContainerTopOptions = {};
        if (options.options !== undefined) {
          opts.Options = options.options;
        }
        await this.top(name, options.select, opts);
      });
  }

  private _stats(cmd: command.Command) {
    cmd
      .command("stats <name:string>", "Display a live stream of service resource usage statistics")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "active" })
      .option("-d, --details", "Show extra details provided to stats")
      .option("-f, --follow", "Follow stats output")
      .action(async (options, name) => {
        const opts: ContainerStatsOptions = {};
        if (options.details !== undefined) {
          opts.NoTrunc = options.details;
        }
        if (options.follow !== undefined) {
          opts.Stream = options.follow;
        }
        await this.stats(name, options.select, opts);
      });
  }

  private _copy(cmd: command.Command) {
    cmd
      .command("copy <source:string> <target:string>", "Copy files/folders between a service and the local filesystem")
      .alias("cp")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "active" })
      .option("-a, --archive", "Archive mode")
      .option("-f, --follow-link", "Always follow symbol link in SRC_PATH")
      .action(async (options, source, target) => {
        const opts: ContainerCopyOptions = {};
        if (options.archive !== undefined) {
          opts.Archive = options.archive;
        }
        if (options.followLink !== undefined) {
          opts.FollowLink = options.followLink;
        }
        await this.copy(source, target, options.select, opts);
      });
  }

  private _wait(cmd: command.Command) {
    cmd
      .command("wait <name...:string>", "Block until one or more service stop, then print their exit codes")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in services", { default: "all" })
      .action(async (options, ...names) => {
        await this.wait(names, options.select);
      });
  }

  // endregion
}
