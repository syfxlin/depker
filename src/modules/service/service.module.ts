import {
  ContainerCopyOptions,
  ContainerExecOptions,
  ContainerKillOptions,
  ContainerLogsOptions,
  ContainerRemoveOptions,
  ContainerRestartOptions,
  ContainerStartOptions,
  ContainerStatsOptions,
  ContainerStopOptions,
  ContainerTopOptions,
} from "../../types/results.type.ts";
import { Depker } from "../../depker.ts";
import { Command } from "../../deps.ts";
import { PackContext } from "./pack.context.ts";
import { DepkerModule } from "../../types/modules.type.ts";
import { ServiceConfig } from "./service.type.ts";
import { ProxyModule } from "../proxy/proxy.module.ts";

declare global {
  interface DepkerApp {
    service(config: ServiceConfig): DepkerApp;
  }
}

export class ServiceModule implements DepkerModule {
  public static readonly NAME = "service";
  private readonly _depker: Depker;
  private readonly _services: Array<ServiceConfig>;

  constructor(depker: Depker) {
    this._depker = depker;
    this._services = [];
    this._depker.inject(ServiceModule.NAME, this.register.bind(this));
    this._depker.dependency(ProxyModule.NAME, () => new ProxyModule(this._depker));
  }

  public get name() {
    return ServiceModule.NAME;
  }

  public async init() {
    const service = new Command<Record<string, any>>().description("Manage services").default("list");
    this._deploy(service);
    this._list(service);
    this._inspect(service);
    this._start(service);
    this._restart(service);
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
    this._depker.cli.command("service", service);

    this._deploy(this._depker.cli);
    this._list(this._depker.cli);
    this._inspect(this._depker.cli);
    this._start(this._depker.cli);
    this._restart(this._depker.cli);
    this._stop(this._depker.cli);
    this._kill(this._depker.cli);
    this._remove(this._depker.cli);
    this._rename(this._depker.cli);
    this._prune(this._depker.cli);
    this._exec(this._depker.cli);
    this._logs(this._depker.cli);
    this._top(this._depker.cli);
    this._stats(this._depker.cli);
    this._copy(this._depker.cli);
    this._wait(this._depker.cli);
  }

  // region register

  public register(config: ServiceConfig) {
    this._services.push(config);
  }

  // endregion

  // region commands

  private _deploy(cmd: Command<Record<string, any>>) {
    cmd
      .command("deploy [name...:string]", "Deploy services")
      .alias("dep")
      .action(async (options: Record<string, any>, ...names: string[]) => {
        if (names.length) {
          for (const service of this._services.filter((n) => names.indexOf(n.name) !== -1)) {
            await PackContext.deployment(this._depker, service);
          }
        } else {
          for (const service of this._services) {
            await PackContext.deployment(this._depker, service);
          }
        }
      });
  }

  private _list(cmd: Command<Record<string, any>>) {
    cmd
      .command("list", "List services")
      .alias("ls")
      .option("-f, --filter <filter:string>", "Filter output based on conditions provided")
      .option("--format <format:string>", "Pretty-print services using nunjucks template")
      .option("--json", "Pretty-print services using json")
      .option("--yaml", "Pretty-print services using yaml")
      .action(async (options: Record<string, any>) => {
        const fulls = await this._depker.ops.container.list();
        const infos = fulls.filter((i) => this._depker.log.filter(options.filter, i));
        if (options.format) {
          this._depker.log.render(options.format, infos);
        } else if (options.json) {
          this._depker.log.json(infos);
        } else if (options.yaml) {
          this._depker.log.yaml(infos);
        } else {
          const header = ["ID", "Name", "Image", "Status", "Ports", "CreatedAt"];
          const body = infos.map((i) => [
            this._depker.uti.short(i.Id),
            i.Name,
            i.Image,
            i.State,
            i.Ports,
            this._depker.uti.date(i.Created),
          ]);
          this._depker.log.table(header, body);
        }
      });
  }

  private _inspect(cmd: Command<Record<string, any>>) {
    cmd
      .command("inspect <name...:string>", "Display detailed information on one or more services")
      .alias("is")
      .option("-f, --filter <filter:string>", "Filter output based on conditions provided")
      .option("--format <format:string>", "Pretty-print services using nunjucks template")
      .option("--json", "Pretty-print services using json")
      .option("--yaml", "Pretty-print services using yaml")
      .action(async (options: Record<string, any>, ...names: string[]) => {
        const fulls = await this._depker.ops.container.inspect(names);
        const infos = fulls.filter((i) => this._depker.log.filter(options.filter, i));
        if (options.format) {
          this._depker.log.render(options.format, infos);
        } else if (options.json) {
          this._depker.log.json(infos);
        } else if (options.yaml) {
          this._depker.log.yaml(infos);
        } else {
          this._depker.log.json(infos);
        }
      });
  }

  private _start(cmd: Command<Record<string, any>>) {
    cmd
      .command("start <name...:string>", "Start one or more stopped services")
      .option("-i, --interactive", "Attach service's STDIN")
      .option("-a, --attach", "Attach STDOUT/STDERR and forward signals")
      .option("--detach-keys <keys:string>", "Override the key sequence for detaching a service")
      .action(async (options: Record<string, any>, ...name: string[]) => {
        this._depker.log.step(`Starting services started.`);
        try {
          const opts: ContainerStartOptions = {};
          if (options.interactive !== undefined) {
            opts.Interactive = options.interactive;
          }
          if (options.attach !== undefined) {
            opts.Attach = options.attach;
          }
          if (options.detachKeys !== undefined) {
            opts.DetachKeys = options.detachKeys;
          }
          await this._depker.ops.container.start(name, opts);
          this._depker.log.done(`Starting services successfully.`);
        } catch (e) {
          this._depker.log.error(`Starting services failed.`, e);
        }
      });
  }

  private _restart(cmd: Command<Record<string, any>>) {
    cmd
      .command("restart <name...:string>", "Restart one or more services")
      .option("-t, --time <time:integer>", "Seconds to wait for stop before killing the service")
      .option("-s, --signal <signal:string>", "Signal to send to the service")
      .action(async (options: Record<string, any>, ...name: string[]) => {
        this._depker.log.step(`Restarting services started.`);
        try {
          const opts: ContainerRestartOptions = {};
          if (options.time !== undefined) {
            opts.Time = options.time;
          }
          if (options.signal !== undefined) {
            opts.Signal = options.signal;
          }
          await this._depker.ops.container.restart(name, opts);
          this._depker.log.done(`Restarting services successfully.`);
        } catch (e) {
          this._depker.log.error(`Restarting services failed.`, e);
        }
      });
  }

  private _stop(cmd: Command<Record<string, any>>) {
    cmd
      .command("stop <name...:string>", "Stop one or more running services")
      .option("-t, --time <time:integer>", "Seconds to wait for stop before killing the service")
      .option("-s, --signal <signal:string>", "Signal to send to the service")
      .action(async (options: Record<string, any>, ...name: string[]) => {
        this._depker.log.step(`Stopping services started.`);
        try {
          const opts: ContainerStopOptions = {};
          if (options.time !== undefined) {
            opts.Time = options.time;
          }
          if (options.signal !== undefined) {
            opts.Signal = options.signal;
          }
          await this._depker.ops.container.stop(name, opts);
          this._depker.log.done(`Stopping services successfully.`);
        } catch (e) {
          this._depker.log.error(`Stopping services failed.`, e);
        }
      });
  }

  private _kill(cmd: Command<Record<string, any>>) {
    cmd
      .command("kill <name...:string>", "Kill one or more running services")
      .option("-s, --signal <signal:string>", "Signal to send to the service")
      .action(async (options: Record<string, any>, ...name: string[]) => {
        this._depker.log.step(`Killing services started.`);
        try {
          const opts: ContainerKillOptions = {};
          if (options.signal !== undefined) {
            opts.Signal = options.signal;
          }
          await this._depker.ops.container.kill(name, opts);
          this._depker.log.done(`Killing services successfully.`);
        } catch (e) {
          this._depker.log.error(`Killing services failed.`, e);
        }
      });
  }

  private _remove(cmd: Command<Record<string, any>>) {
    cmd
      .command("remove <name...:string>", "Remove one or more services")
      .alias("rm")
      .option("-f, --force", "Force the removal of a running service")
      .option("-l, --link", "Remove the specified link")
      .option("-v, --volumes", "Remove anonymous volumes associated with the service")
      .action(async (options: Record<string, any>, ...names: string[]) => {
        this._depker.log.step(`Removing services started.`);
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
          await this._depker.ops.container.remove(names, opts);
          this._depker.log.done(`Removing services successfully.`);
        } catch (e) {
          this._depker.log.error(`Removing services failed.`, e);
        }
      });
  }

  private _rename(cmd: Command<Record<string, any>>) {
    cmd
      .command("rename <name:string> <rename:string>", "Rename a service")
      .action(async (options: Record<string, any>, name: string, rename: string) => {
        this._depker.log.step(`Renaming services started.`);
        try {
          await this._depker.ops.container.rename(name, rename);
          this._depker.log.done(`Renaming services successfully.`);
        } catch (e) {
          this._depker.log.error(`Renaming services failed.`, e);
        }
      });
  }

  private _prune(cmd: Command<Record<string, any>>) {
    cmd
      .command("prune", "Remove all abnormal services")
      .option("-f, --force", "Force the removal of stopped service")
      .option("-l, --link", "Remove the specified link")
      .option("-v, --volumes", "Remove anonymous volumes associated with the service")
      .action(async (options: Record<string, any>) => {
        this._depker.log.step(`Pruning services started.`);
        try {
          const infos = await this._depker.ops.container.list();
          const insps = await this._depker.ops.container.inspect(infos.map((i) => i.Id));
          const needs = new Set<string>();
          for (const insp of insps) {
            const oname = insp.Name;
            const dname = insp.Config.Labels["depker.name"];
            const status = insp.State.Status.toLowerCase();
            const health = insp.State.Health?.Status?.toLowerCase();
            if (dname && dname !== oname) {
              needs.add(insp.Id);
            }
            if (options.force && status !== "created" && health !== "starting") {
              if (status !== "running" || (health && health !== "healthy")) {
                needs.add(insp.Id);
              }
            }
          }
          if (needs.size) {
            await this._depker.ops.container.remove([...needs], {
              Force: true,
              Link: options.link,
              Volumes: options.volumes,
            });
          }
          this._depker.log.done(`Pruning services successfully.`);
        } catch (e) {
          this._depker.log.error(`Pruning services failed.`, e);
        }
      });
  }

  private _exec(cmd: Command<Record<string, any>>) {
    cmd
      .command("exec <name:string> <commands...:string>", "Run a command in a running service")
      .option("-t, --tty", "Allocate a pseudo-TTY")
      .option("-d, --detach", "Override the key sequence for detaching a service")
      .option("-i, --interactive", "Keep STDIN open even if not attached")
      .option("-p, --privileged", "Give extended privileges to the command")
      .option("-u, --user <user:string>", "Username or UID (format: <name|uid>[:<group|gid>])")
      .option("-w, --workdir <dir:string>", "Working directory inside the service")
      .option("-e, --env <env:string>", "Set environment variables", { collect: true })
      .option("--env-file <file:string>", "Read in a file of environment variables", { collect: true })
      .option("--detach-keys <keys:string>", "Override the key sequence for detaching a service")
      .action(async (options: Record<string, any>, name: string, ...commands: string[]) => {
        const opts: ContainerExecOptions = {};
        if (options.tty !== undefined) {
          opts.Tty = options.tty;
        }
        if (options.detach !== undefined) {
          opts.Detach = options.detach;
        }
        if (options.detachKeys !== undefined) {
          opts.DetachKeys = options.detachKeys;
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
        if (options.env !== undefined) {
          opts.Envs = this._depker.uti.kv(options.env);
        }
        if (options.envFile !== undefined) {
          opts.EnvFiles = options.envFile;
        }
        // prettier-ignore
        await this._depker.ops.container
          .exec(name, commands, opts)
          .stdin("inherit")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });
  }

  private _logs(cmd: Command<Record<string, any>>) {
    cmd
      .command("logs <name:string>", "Fetch the logs of a service")
      .option("-d, --details", "Show extra details provided to logs")
      .option("-f, --follow", "Follow log output")
      .option("-t, --timestamps", "Show timestamps")
      .option("-n, --tail <tail:string>", "Number of lines to show from the end of the logs")
      .option("-s, --since <since:string>", "Show logs since timestamp")
      .option("-u, --until <until:string>", "Show logs before a timestamp")
      .action(async (options: Record<string, any>, name: string) => {
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
        // prettier-ignore
        await this._depker.ops.container
          .logs(name, opts)
          .stdin("null")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });
  }

  private _top(cmd: Command<Record<string, any>>) {
    cmd
      .command("top <name:string>", "Display the running processes of a service")
      .option("-o, --options <options:string>", "Input ps options")
      .action(async (options: Record<string, any>, name: string) => {
        const opts: ContainerTopOptions = {};
        if (options.options !== undefined) {
          opts.Options = options.options;
        }
        // prettier-ignore
        await this._depker.ops.container
          .top(name, opts)
          .stdin("null")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });
  }

  private _stats(cmd: Command<Record<string, any>>) {
    cmd
      .command("stats <name:string>", "Display a live stream of service resource usage statistics")
      .option("-d, --details", "Show extra details provided to stats")
      .option("-f, --follow", "Follow stats output")
      .action(async (options: Record<string, any>, name: string) => {
        const opts: ContainerStatsOptions = {};
        if (options.details !== undefined) {
          opts.NoTrunc = options.details;
        }
        if (options.follow !== undefined) {
          opts.Stream = options.follow;
        }
        // prettier-ignore
        await this._depker.ops.container
          .stats(name, opts)
          .stdin("null")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });
  }

  private _copy(cmd: Command<Record<string, any>>) {
    cmd
      .command("copy <source:string> <target:string>", "Copy files/folders between a service and the local filesystem")
      .alias("cp")
      .option("-a, --archive", "Archive mode")
      .option("-f, --follow-link", "Always follow symbol link in SRC_PATH")
      .action(async (options: Record<string, any>, source: string, target: string) => {
        const opts: ContainerCopyOptions = {};
        if (options.archive !== undefined) {
          opts.Archive = options.archive;
        }
        if (options.followLink !== undefined) {
          opts.FollowLink = options.followLink;
        }
        // prettier-ignore
        await this._depker.ops.container
          .copy(source, target, opts)
          .stdin("inherit")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });
  }

  private _wait(cmd: Command<Record<string, any>>) {
    cmd
      .command("wait <name...:string>", "Block until one or more service stop, then print their exit codes")
      .action(async (options: Record<string, any>, ...names: string[]) => {
        await this._depker.ops.container.wait(names);
      });
  }

  // endregion
}
