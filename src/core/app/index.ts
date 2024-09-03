import { ArgumentValue, Command, EnumType } from "../../deps/jsr/command.ts";
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
} from "../../providers/types.ts";
import { Depker, DepkerPlugin } from "../../depker.ts";
import { PackContext } from "./ctx.ts";

type PruneSelect = "all" | "pre";

type ActiveSelect = "active" | "latest" | string;

type AllSelect = "active" | "latest" | "inactive" | "all" | string;

class PruneSelectType extends EnumType<PruneSelect> {
  constructor() {
    super(["all", "pre"]);
  }
}

class ActiveSelectType extends EnumType<ActiveSelect> {
  constructor() {
    super(["active", "latest", "<container>"]);
  }

  public parse(type: ArgumentValue): "active" | "latest" | string {
    return type.value;
  }
}

class AllSelectType extends EnumType<AllSelect> {
  constructor() {
    super(["active", "latest", "inactive", "all", "<container>"]);
  }

  public parse(type: ArgumentValue): "active" | "latest" | "inactive" | "all" | string {
    return type.value;
  }
}

export interface AppConfig {
  // basic
  name: string;
  path?: string;

  // service
  file?: string;
  pull?: boolean;
  cache?: boolean;
  restart?: "no" | "on-failure" | "always";
  commands?: string[];
  entrypoints?: string[];
  init?: boolean;
  remove?: boolean;
  labels?: Record<string, string>;
  secrets?: Record<string, string>;
  build_args?: Record<string, string>;
  ports?: Array<{
    hport: number;
    cport: number;
    proto?: "tcp" | "udp";
  }>;
  volumes?: Array<{
    hpath: string;
    cpath: string;
    readonly?: boolean;
  }>;

  // host
  domain?: string | string[];
  rule?: string;
  tls?: boolean;
  scheme?: string;
  port?: number;
  middlewares?: Array<{
    name: string;
    type: string;
    options?: Record<string, string>;
  }>;
  healthcheck?: {
    commands: string[];
    period?: string;
    interval?: string;
    retries?: string;
    timeout?: string;
  };

  // networks
  mac?: string;
  dns?: string[];
  ipv4?: string;
  ipv6?: string;
  host?: string;
  hosts?: string[];
  networks?: string[];

  // resources
  cpu?: string;
  memory?: string;
  oom_kill?: boolean;

  // privilege
  privileged?: boolean;
  cap_adds?: string[];
  cap_drops?: string[];

  // runtime
  user?: string;
  workdir?: string;
  groups?: string[];

  // extension
  [key: number | string | symbol]: any;
}

export function app() {
  return function app(depker: Depker) {
    return new AppPlugin(depker);
  };
}

export class AppPlugin implements DepkerPlugin {
  public static readonly NAME = "app";
  private readonly depker: Depker;
  private readonly config: Array<AppConfig>;

  constructor(depker: Depker) {
    this.depker = depker;
    this.config = [];
  }

  public async init() {
    const app = new Command().description("Manage applications").alias("app").alias("application").alias("applications").default("list");
    this._deploy(app);
    this._list(app);
    this._inspect(app);
    this._start(app);
    this._stop(app);
    this._kill(app);
    this._remove(app);
    this._rename(app);
    this._prune(app);
    this._top(app);
    this._copy(app);
    this._wait(app);
    this._exec(app);
    this._logs(app);
    this._stats(app);
    this._shell(app);
    this.depker.cli.command("apps", app);

    this._deploy(this.depker.cli);
    this._list(this.depker.cli);
    this._inspect(this.depker.cli);
    this._start(this.depker.cli);
    this._stop(this.depker.cli);
    this._kill(this.depker.cli);
    this._remove(this.depker.cli);
    this._rename(this.depker.cli);
    this._prune(this.depker.cli);
    this._top(this.depker.cli);
    this._copy(this.depker.cli);
    this._wait(this.depker.cli);
    this._exec(this.depker.cli);
    this._logs(this.depker.cli);
    this._stats(this.depker.cli);
    this._shell(this.depker.cli);
  }

  // region public functions

  public register(...configs: Array<AppConfig>): void {
    this.config.push(...configs);
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

  public async deploy(...configs: Array<string | AppConfig>): Promise<void> {
    if (configs.length) {
      for (const config of configs) {
        if (typeof config === "string") {
          const app = this.config.find(s => s.name === config);
          if (app) {
            await PackContext.create(this.depker, app).execute();
          }
        } else if (config) {
          await PackContext.create(this.depker, config).execute();
        }
      }
    } else {
      for (const app of this.config) {
        await PackContext.create(this.depker, app).execute();
      }
    }
  }

  public async list(names: string[] = [], select?: AllSelect): Promise<Record<string, Array<ContainerInspect>>> {
    const infos = await this.depker.node.container.list();
    const insps = await this.depker.node.container.inspect(infos.map(i => i.Id));
    const items: Record<string, Array<ContainerInspect>> = {};
    for (const insp of insps) {
      const exec = /^([a-zA-Z0-9][a-zA-Z0-9.-]*)\.[a-z0-9]+$/.exec(insp.Name);
      const name = exec ? exec[1] : insp.Name;
      if (!names.length || names.includes(name)) {
        items[name] = items[name] ?? [];
        items[name].push(insp);
        items[name].sort((a, b) => b.Name.localeCompare(a.Name));
      }
    }
    const inspects: Record<string, Array<ContainerInspect>> = {};
    for (const [name, instances] of Object.entries(items)) {
      const selected = this.select(instances, select ?? "all");
      if (selected.length) {
        inspects[name] = selected;
      }
    }
    return inspects;
  }

  public async start(names: string[], select?: AllSelect, options?: ContainerStartOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map(i => i.Id));
    }
    if (ids.length) {
      await this.depker.node.container.start(ids, options);
    }
  }

  public async stop(names: string[], select?: AllSelect, options?: ContainerStopOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map(i => i.Id));
    }
    if (ids.length) {
      await this.depker.node.container.stop(ids, options);
    }
  }

  public async kill(names: string[], select?: AllSelect, options?: ContainerKillOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map(i => i.Id));
    }
    if (ids.length) {
      await this.depker.node.container.kill(ids, options);
    }
  }

  public async remove(names: string[], select?: AllSelect, options?: ContainerRemoveOptions): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map(i => i.Id));
    }
    if (ids.length) {
      await this.depker.node.container.remove(ids, options);
    }
  }

  public async rename(name: string, rename: string, select?: AllSelect): Promise<void> {
    for (const infos of Object.values(await this.list([name], select))) {
      for (const info of infos) {
        const exec = /^[a-zA-Z0-9][\w.-]*-i(\d+)$/.exec(info.Name);
        if (exec) {
          await this.depker.node.container.rename(info.Id, `${rename}-i${exec[1]}`);
        } else {
          await this.depker.node.container.rename(info.Id, rename);
        }
      }
    }
  }

  public async copy(source: string, target: string, select?: ActiveSelect, options?: ContainerCopyOptions) {
    const sources = source.split(":");
    const targets = target.split(":");
    if (sources.length > 1) {
      const inspect = await this.list([sources[0]], select ?? "active").then(a => a[sources[0]]?.[0]);
      sources[0] = inspect.Id;
    }
    if (targets.length > 1) {
      const inspect = await this.list([targets[0]], select ?? "active").then(a => a[targets[0]]?.[0]);
      targets[0] = inspect.Id;
    }
    await this.depker.node.container
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
      await this.depker.node.container.remove(ids, {
        Force: true,
        Link: options?.Link,
        Volumes: options?.Volumes,
      });
    }
  }

  public async wait(names: string[], select?: AllSelect): Promise<void> {
    const ids: string[] = [];
    for (const infos of Object.values(await this.list(names, select))) {
      ids.push(...infos.map(i => i.Id));
    }
    if (ids.length) {
      await this.depker.node.container.wait(ids);
    }
  }

  public async logs(name: string, select?: ActiveSelect, options?: ContainerLogsOptions) {
    const inspect = await this.list([name], select ?? "active").then(a => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}.`);
    }
    await this.depker.node.container
      .logs(inspect.Id, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  public async top(name: string, select?: ActiveSelect, options?: ContainerTopOptions) {
    const inspect = await this.list([name], select ?? "active").then(a => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}.`);
    }
    await this.depker.node.container
      .top(inspect.Id, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  public async stats(name: string, select?: ActiveSelect, options?: ContainerStatsOptions) {
    const inspect = await this.list([name], select ?? "active").then(a => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}.`);
    }
    await this.depker.node.container
      .stats(inspect.Id, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  public async exec(name: string, commands: string[], select?: ActiveSelect, options?: ContainerExecOptions) {
    const inspect = await this.list([name], select ?? "active").then(a => a[name]?.[0]);
    if (!inspect) {
      throw new Error(`No suck container: ${name}.`);
    }
    await this.depker.node.container
      .exec(inspect.Id, commands, options)
      .stdin("inherit")
      .stdout("inherit")
      .stderr("inherit")
      .spawn();
  }

  // endregion

  // region private commands

  private _deploy(cmd: Command) {
    cmd
      .command("deploy [name...:string]", "Deploy apps")
      .alias("dep")
      .action(async (_options, ...names) => {
        await this.deploy(...names);
      });
  }

  private _list(cmd: Command) {
    cmd
      .command("list [name...:string]", "List apps")
      .alias("ls")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, ...names) => {
        const infos = Object.entries(await this.list(names, options.select)).map(e => ({ Name: e[0], Items: e[1] }));
        if (options.json) {
          this.depker.log.json(infos);
        } else if (options.yaml) {
          this.depker.log.yaml(infos);
        } else {
          const header = ["Name", "Activated", "Status", "Image", "CreatedAt", "Containers"];
          const body = infos.map((info) => {
            const item = this.select(info.Items, "active")[0] ?? this.select(info.Items, "latest")[0];
            return [
              `${info.Name}`,
              `${item.Name}`,
              `${item.State.Status}${item.State?.Health?.Status ? ` (${item.State?.Health?.Status})` : ``}`,
              `${item.Config.Image}`,
              `${this.depker.log.date(item.Created)}`,
              `${info.Items.map(i => `${i.Name} [${i.State.Status}${i.State?.Health?.Status ? ` (${i.State?.Health?.Status})` : ``}]`).join("\n")}`,
            ];
          });
          this.depker.log.table(header, body);
        }
      });
  }

  private _inspect(cmd: Command) {
    cmd
      .command("inspect <name...:string>", "Display detailed information on one or more apps")
      .alias("is")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options, ...names) => {
        const infos = Object.entries(await this.list(names, options.select)).map(e => ({ Name: e[0], Items: e[1] }));
        if (options.json) {
          this.depker.log.json(infos);
        } else {
          this.depker.log.yaml(infos);
        }
      });
  }

  private _start(cmd: Command) {
    cmd
      .command("start <name...:string>", "Start one or more stopped apps")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .option("-i, --interactive", "Attach app's STDIN")
      .option("-a, --attach", "Attach STDOUT/STDERR and forward signals")
      .action(async (options, ...names) => {
        this.depker.log.step(`Starting apps started.`);
        try {
          const opts: ContainerStartOptions = {};
          if (options.interactive !== undefined) {
            opts.Interactive = options.interactive;
          }
          if (options.attach !== undefined) {
            opts.Attach = options.attach;
          }
          await this.start(names, options.select, opts);
          this.depker.log.done(`Starting apps successfully.`);
        } catch (e) {
          this.depker.log.error(`Starting apps failed.`, e);
        }
      });
  }

  private _stop(cmd: Command) {
    cmd
      .command("stop <name...:string>", "Stop one or more running apps")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .option("-t, --time <time:integer>", "Seconds to wait for stop before killing the app")
      .option("-i, --signal <signal:string>", "Signal to send to the app")
      .action(async (options, ...names) => {
        this.depker.log.step(`Stopping apps started.`);
        try {
          const opts: ContainerStopOptions = {};
          if (options.time !== undefined) {
            opts.Time = String(options.time);
          }
          if (options.signal !== undefined) {
            opts.Signal = options.signal;
          }
          await this.stop(names, options.select, opts);
          this.depker.log.done(`Stopping apps successfully.`);
        } catch (e) {
          this.depker.log.error(`Stopping apps failed.`, e);
        }
      });
  }

  private _kill(cmd: Command) {
    cmd
      .command("kill <name...:string>", "Kill one or more running apps")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .option("-i, --signal <signal:string>", "Signal to send to the app")
      .action(async (options, ...names) => {
        this.depker.log.step(`Killing apps started.`);
        try {
          const opts: ContainerKillOptions = {};
          if (options.signal !== undefined) {
            opts.Signal = options.signal;
          }
          await this.kill(names, options.select, opts);
          this.depker.log.done(`Killing apps successfully.`);
        } catch (e) {
          this.depker.log.error(`Killing apps failed.`, e);
        }
      });
  }

  private _remove(cmd: Command) {
    cmd
      .command("remove <name...:string>", "Remove one or more apps")
      .alias("rm")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .option("-f, --force", "Force the removal of a running app")
      .option("-l, --link", "Remove the specified link")
      .option("-v, --volumes", "Remove anonymous volumes associated with the app")
      .action(async (options, ...names) => {
        this.depker.log.step(`Removing apps started.`);
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
          this.depker.log.done(`Removing apps successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing apps failed.`, e);
        }
      });
  }

  private _rename(cmd: Command) {
    cmd
      .command("rename <name:string> <rename:string>", "Rename a app")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .action(async (options, name, rename) => {
        this.depker.log.step(`Renaming apps started.`);
        try {
          await this.rename(name, rename, options.select);
          this.depker.log.done(`Renaming apps successfully.`);
        } catch (e) {
          this.depker.log.error(`Renaming apps failed.`, e);
        }
      });
  }

  private _prune(cmd: Command) {
    cmd
      .command("prune", "Remove all abnormal apps")
      .alias("clean")
      .alias("clear")
      .type("select", new PruneSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .option("-f, --force", "Force the removal of stopped app")
      .option("-l, --link", "Remove the specified link")
      .option("-v, --volumes", "Remove anonymous volumes associated with the app")
      .action(async (options) => {
        this.depker.log.step(`Pruning apps started.`);
        try {
          await this.prune(options.select as PruneSelect, {
            Link: options.link,
            Volumes: options.volumes,
          });
          this.depker.log.done(`Pruning apps successfully.`);
        } catch (e) {
          this.depker.log.error(`Pruning apps failed.`, e);
        }
      });
  }

  private _top(cmd: Command) {
    cmd
      .command("top <name:string>", "Display the running processes of a app")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "active" })
      .option("-o, --options <options:string>", "Input ps options")
      .action(async (options, name) => {
        const opts: ContainerTopOptions = {};
        if (options.options !== undefined) {
          opts.Options = options.options;
        }
        await this.top(name, options.select, opts);
      });
  }

  private _copy(cmd: Command) {
    cmd
      .command("copy <source:string> <target:string>", "Copy files/folders between a app and the local filesystem")
      .alias("cp")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "active" })
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

  private _wait(cmd: Command) {
    cmd
      .command("wait <name...:string>", "Block until one or more app stop, then print their exit codes")
      .type("select", new AllSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "all" })
      .action(async (options, ...names) => {
        await this.wait(names, options.select);
      });
  }

  private _exec(cmd: Command) {
    cmd
      .command("exec <name:string> <commands...:string>", "Run a command in a running app")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "active" })
      .option("-t, --tty", "Allocate a pseudo-TTY")
      .option("-d, --detach", "Override the key sequence for detaching a app")
      .option("-i, --interactive", "Keep STDIN open even if not attached")
      .option("-p, --privileged", "Give extended privileges to the command")
      .option("-u, --user <user:string>", "Username or UID (format: <name|uid>[:<group|gid>])")
      .option("-w, --workdir <dir:string>", "Working directory inside the app")
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

  private _logs(cmd: Command) {
    cmd
      .command("logs <name:string>", "Fetch the logs of a app")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "active" })
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

  private _stats(cmd: Command) {
    cmd
      .command("stats <name:string>", "Display a live stream of app resource usage statistics")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "active" })
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

  private _shell(cmd: Command) {
    cmd
      .command("shell <name:string>", "Run a shell in a running app")
      .type("select", new ActiveSelectType())
      .option("-s, --select <select:select>", "Select the container to display in apps", { default: "active" })
      .option("-p, --privileged", "Give extended privileges to the command")
      .option("-u, --user <user:string>", "Username or UID (format: <name|uid>[:<group|gid>])")
      .option("-w, --workdir <dir:string>", "Working directory inside the app")
      .action(async (options, name) => {
        const opts: ContainerExecOptions = {
          Tty: true,
          Interactive: true,
        };
        if (options.privileged !== undefined) {
          opts.Privileged = options.privileged;
        }
        if (options.user !== undefined) {
          opts.User = options.user;
        }
        if (options.workdir !== undefined) {
          opts.Workdir = options.workdir;
        }
        await this.exec(name, ["sh", "-c", "(zsh || fish || bash || ash || sh)"], options.select, opts);
      });
  }

  // endregion
}
