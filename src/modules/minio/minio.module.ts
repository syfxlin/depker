import { Depker, DepkerModule } from "../../depker.ts";
import { command, dax } from "../../deps.ts";
import { ContainerExecOptions } from "../../services/run/index.ts";
import { MinioConfig } from "./minio.type.ts";

export class MinioModule implements DepkerModule {
  public static readonly NAME = "minio";
  public static readonly IMAGE = "minio/minio:latest";

  constructor(private readonly depker: Depker) {}

  public get name() {
    return MinioModule.NAME;
  }

  public async init(): Promise<void> {
    const mc = new command.Command().description("Minio client");
    const minio = new command.Command().description("Manage minio");

    mc.arguments("[...args]")
      .stopEarly()
      .action(async (_options, ...args) => {
        await this.mc(args, { Tty: true, Interactive: true })
          .stdin("inherit")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });
    minio
      .command("reload", "Reload or create a new minio service")
      .alias("create")
      .action(async () => {
        this.depker.log.step(`Reloading minio service started.`);
        try {
          await this.reload();
          this.depker.log.done(`Reloading minio service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reloading minio service failed.`, e);
        }
      });
    minio.command("client [...args]", "Use the Minio Client to operate the storage service")
      .stopEarly()
      .action(async (_options, ...args) => {
        await this.mc(args, { Tty: true, Interactive: true })
          .stdin("inherit")
          .stdout("inherit")
          .stderr("inherit")
          .spawn();
      });

    this.depker.cli.command("mc", mc);
    this.depker.cli.command("minio", minio);
  }

  public mc(commands: string[], options?: ContainerExecOptions): dax.CommandBuilder {
    return this.depker.ops.container.exec(MinioModule.NAME, [`mc`, ...commands], options);
  }

  public async reload(config?: MinioConfig) {
    await this.depker.emit("minio:before-reload", this);
    this.depker.log.debug(`Minio reloading started.`);

    if (config) {
      if (!config.username || !config.password) {
        config.username = config.username ?? "minio";
        config.password = config.password ?? crypto.randomUUID();
      }
      await this.depker.cfg.config(MinioModule.NAME, config);
    } else {
      config = await this.depker.cfg.config<MinioConfig>(MinioModule.NAME);
      if (!config.username || !config.password) {
        config.username = config.username ?? "minio";
        config.password = config.password ?? crypto.randomUUID();
        await this.depker.cfg.config(MinioModule.NAME, config);
      }
    }

    try {
      await this.depker.ops.container.remove([MinioModule.NAME], { Force: true });
    } catch (e) {
      // ignore
    }

    const envs = { ...config.envs };
    const labels = { ...config.labels };
    const network = await this.depker.ops.network.default();

    envs.MINIO_VOLUMES = "/mnt/data";
    envs.MINIO_ROOT_USER = config.username;
    envs.MINIO_ROOT_PASSWORD = config.password;
    if (config.domain || config.console) {
      labels["traefik.enable"] = "true";
      labels["traefik.docker.network"] = network;
    }
    if (config.domain) {
      labels[`traefik.http.routers.minio.service`] = "minio";
      labels[`traefik.http.services.minio.loadbalancer.server.scheme`] = "http";
      labels[`traefik.http.services.minio.loadbalancer.server.port`] = "9000";
      if (config.tls) {
        envs.MINIO_SERVER_URL = `https://${config.domain}`;
        labels[`traefik.http.routers.minio.rule`] = `Host(\`${config.domain}\`)`;
        labels[`traefik.http.routers.minio.entrypoints`] = "https";
        labels[`traefik.http.routers.minio.tls.certresolver`] = "depker";
      } else {
        envs.MINIO_SERVER_URL = `http://${config.domain}`;
        labels[`traefik.http.routers.minio.rule`] = `Host(\`${config.domain}\`)`;
        labels[`traefik.http.routers.minio.entrypoints`] = "http";
      }
    }
    if (config.console) {
      labels[`traefik.http.routers.minio-console.service`] = "minio-console";
      labels[`traefik.http.services.minio-console.loadbalancer.server.scheme`] = "http";
      labels[`traefik.http.services.minio-console.loadbalancer.server.port`] = "9000";
      if (config.tls) {
        labels[`traefik.http.routers.minio-console.rule`] = `Host(\`${config.domain}\`)`;
        labels[`traefik.http.routers.minio-console.entrypoints`] = "https";
        labels[`traefik.http.routers.minio-console.tls.certresolver`] = "depker";
      } else {
        labels[`traefik.http.routers.minio-console.rule`] = `Host(\`${config.domain}\`)`;
        labels[`traefik.http.routers.minio-console.entrypoints`] = "http";
      }
    }

    await this.depker.ops.container.run(MinioModule.NAME, MinioModule.IMAGE, {
      Detach: true,
      Restart: "always",
      Envs: envs,
      Labels: labels,
      Volumes: [`/var/depker/minio:/mnt/data`],
      Networks: [network],
      Commands: [`minio`, `server`, `--console-address`, `:9001`],
    });
    await this.depker.ops.container.exec(MinioModule.NAME, [`mc`, `alias`, `set`, `minio`, `http://localhost:9000`, config.username, config.password], {
      Detach: true,
    });

    await this.depker.emit("minio:after-reload", this);
    this.depker.log.debug(`Minio reloading successfully.`);
  }
}
