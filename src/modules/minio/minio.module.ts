import { Depker, DepkerModule } from "../../depker.ts";
import { command, cryptoRandomString, dax } from "../../deps.ts";
import { ContainerExecOptions } from "../../services/run/index.ts";
import { MinioConfig, SavedMinioConfig } from "./minio.type.ts";

export class MinioModule implements DepkerModule {
  public static readonly NAME = "minio";
  public static readonly IMAGE = "minio/minio:latest";

  constructor(private readonly depker: Depker) {}

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
      .command("reload", "Reload a new minio service")
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
    minio
      .command("list", "List minio buckets")
      .alias("ls")
      .option("--json", "Pretty-print using json")
      .option("--yaml", "Pretty-print using yaml")
      .action(async (options) => {
        try {
          const buckets = await this.list();
          if (options.json) {
            this.depker.log.json(buckets);
          } else if (options.yaml) {
            this.depker.log.yaml(buckets);
          } else {
            this.depker.log.table(["Bucket"], buckets.map(b => [b]));
          }
        } catch (e) {
          this.depker.log.error(`Listing buckets failed.`, e);
        }
      });
    minio
      .command("insert <bucket...:string>", "Insert minio buckets")
      .alias("add")
      .action(async (_options, ...buckets) => {
        this.depker.log.step(`Inserting buckets started.`);
        try {
          for (let i = 0; i < buckets.length; i++) {
            const data = await this.create(buckets[i]);
            if (i !== 0) {
              this.depker.log.raw(`---`);
            }
            this.depker.log.yaml(data);
          }
          this.depker.log.done(`Inserting buckets successfully.`);
        } catch (e) {
          this.depker.log.error(`Inserting buckets failed.`, e);
        }
      });
    minio
      .command("remove <bucket...:string>", "Remove minio buckets")
      .alias("del")
      .action(async (_options, ...buckets) => {
        this.depker.log.step(`Removing buckets started.`);
        try {
          for (const bucket of buckets) {
            await this.remove(bucket);
          }
          this.depker.log.done(`Removing buckets successfully.`);
        } catch (e) {
          this.depker.log.error(`Removing buckets failed.`, e);
        }
      });

    this.depker.cli.command("mc", mc);
    this.depker.cli.command("minio", minio);
  }

  public async list() {
    const lines = await this.depker.ops.container.exec(MinioModule.NAME, [`mc`, `ls`, `minio`]).lines();
    return lines.map(i => i.replace(/^.+\s+(\w+)\/$/, "$1"));
  }

  public async create(name: string) {
    const user = `${name}`;
    const pass = cryptoRandomString({ length: 16, type: "alphanumeric" });
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "s3:*",
          ],
          Resource: [
            `arn:aws:s3:::${name}/*`,
          ],
        },
      ],
    });
    const commands = [
      `mc mb --ignore-existing minio/${name}`,
      `echo '${policy}' > /tmp/minio-policy-${user}.json`,
      `mc admin user add minio ${user} ${pass}`,
      `mc admin policy create minio ${user} /tmp/minio-policy-${user}.json`,
      `mc admin policy attach minio ${user} --user ${user}`,
    ];
    await this.depker.ops.container.exec(MinioModule.NAME, [`sh`, `-c`, commands.join(" && ")]);
    return { bucket: name, username: name, password: pass };
  }

  public async remove(name: string) {
    const commands = [
      `(mc admin policy detach minio ${name} --user ${name} 2>/dev/null || true)`,
      `(mc admin policy rm minio ${name} 2>/dev/null || true)`,
      `(mc rb --force minio/${name} 2>/dev/null || true)`,
    ];
    await this.depker.ops.container.exec(MinioModule.NAME, [`sh`, `-c`, commands.join(" && ")]);
  }

  public mc(commands: string[], options?: ContainerExecOptions): dax.CommandBuilder {
    return this.depker.ops.container.exec(MinioModule.NAME, [`mc`, ...commands], options);
  }

  public async reload(config?: Omit<MinioConfig, "username" | "password">) {
    await this.depker.emit("minio:before-reload", this);
    this.depker.log.debug(`Minio reloading started.`);

    const saved: SavedMinioConfig = { ...await this.depker.cfg.config<SavedMinioConfig>(MinioModule.NAME), ...config };
    if (config || !saved.username || !saved.password) {
      saved.username = saved.username ?? "root";
      saved.password = saved.password ?? cryptoRandomString({ length: 16, type: "alphanumeric" });
      await this.depker.cfg.config(MinioModule.NAME, saved);
    }

    try {
      await this.depker.ops.container.remove([MinioModule.NAME], { Force: true });
    } catch (e) {
      // ignore
    }

    await this.depker.ops.container.run(MinioModule.NAME, MinioModule.IMAGE, {
      Detach: true,
      Pull: "always",
      Restart: "always",
      Labels: saved.labels,
      Networks: [await this.depker.ops.network.default()],
      Commands: [`minio`, `server`, `--console-address`, `:9001`],
      Envs: {
        ...saved.envs,
        MINIO_VOLUMES: "/mnt/data",
        MINIO_ROOT_USER: saved.username,
        MINIO_ROOT_PASSWORD: saved.password,
      },
      Ports: [
        ...(saved.port ? [`${saved.port}:9000`] : []),
        ...(saved.ports ?? []),
      ],
      Volumes: [
        `/var/depker/minio:/mnt/data`,
        ...(saved.volumes ?? []),
      ],
    });
    await this.depker.ops.container.exec(MinioModule.NAME, [`mc`, `alias`, `set`, `minio`, `http://localhost:9000`, saved.username, saved.password], {
      Detach: true,
    });

    await this.depker.emit("minio:after-reload", this);
    this.depker.log.debug(`Minio reloading successfully.`);
  }
}
