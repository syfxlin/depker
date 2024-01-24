import { cryptoRandomString } from "https://deno.land/x/crypto_random_string@1.1.0/cryptoRandomString.ts";
import { Depker, DepkerModule } from "../../depker.ts";
import { command } from "../../deps.ts";
import { MongoConfig, SavedMongoConfig } from "./mongo.type.ts";

export class MongoModule implements DepkerModule {
  public static readonly NAME = "mongo";
  public static readonly IMAGE = "mongo:latest";

  constructor(private readonly depker: Depker) {}

  public async init(): Promise<void> {
    const mongo = new command.Command().description("Manage mongo");

    mongo
      .command("reload", "Reload a new mongo service")
      .action(async () => {
        this.depker.log.step(`Reloading mongo service started.`);
        try {
          await this.reload();
          this.depker.log.done(`Reloading mongo service successfully.`);
        } catch (e) {
          this.depker.log.error(`Reloading mongo service failed.`, e);
        }
      });

    this.depker.cli.command("mongo", mongo);
  }

  public async reload(config?: Omit<MongoConfig, "username" | "password">) {
    await this.depker.emit("mongo:before-reload", this);
    this.depker.log.debug(`Mongo reloading started.`);

    const saved: SavedMongoConfig = { ...await this.depker.cfg.config<SavedMongoConfig>(MongoModule.NAME), ...config };
    if (config || !saved.username || !saved.password) {
      saved.username = saved.username ?? "root";
      saved.password = saved.password ?? cryptoRandomString({ length: 16, type: "alphanumeric" });
      await this.depker.cfg.config(MongoModule.NAME, saved);
    }

    try {
      await this.depker.ops.container.remove([MongoModule.NAME], { Force: true });
    } catch (e) {
      // ignore
    }

    await this.depker.ops.container.run(MongoModule.NAME, MongoModule.IMAGE, {
      Detach: true,
      Pull: "always",
      Restart: "always",
      Labels: saved.labels,
      Networks: [await this.depker.ops.network.default()],
      Envs: {
        ...saved.envs,
        MONGO_INITDB_ROOT_USERNAME: saved.username,
        MONGO_INITDB_ROOT_PASSWORD: saved.password,
      },
      Ports: [
        ...(saved.port ? [`${saved.port}:27017`] : []),
        ...(saved.ports ?? []),
      ],
      Volumes: [
        `/var/depker/mongo:/data/db`,
        ...(saved.volumes ?? []),
      ],
    });

    await this.depker.emit("mongo:after-reload", this);
    this.depker.log.debug(`Mongo reloading successfully.`);
  }
}
