import os from "os";
import fs from "fs-extra";
import path from "path";
import YAML from "yaml";
import { IMAGES, NAMES, VERSION, VOLUMES } from "../constants/depker.constant";
import { docker, logger } from "../bin";
import { dockerfile, program } from "../constants/config.constant";
import { Command } from "commander";
import { LocalConfig, RemoteConfig } from "../types/config.type";

export class ConfigService {
  private _local: LocalConfig | undefined = undefined;
  private _remote: RemoteConfig | undefined = undefined;

  constructor(private readonly cli: Command) {}

  public get root() {
    const p = this.cli.getOptionValue("config");
    fs.ensureDirSync(p);
    return p;
  }

  public async remote(config?: RemoteConfig): Promise<RemoteConfig> {
    const _init = async () => {
      logger.debug(`Remote config container not found, creating container.`);
      const debug = this.cli.getOptionValue("debug");
      const target = path.join(os.tmpdir(), `depker-config-${Date.now()}`);
      await fs.ensureDir(target);
      await fs.writeFile(path.join(target, `Dockerfile`), dockerfile);
      await fs.writeFile(path.join(target, `depker.go`), program);
      await docker.containers.build(IMAGES.CONFIG, target, {}, { stdio: debug ? "inherit" : "ignore" });
      await docker.containers.run(NAMES.CONFIG, IMAGES.CONFIG, {
        detach: true,
        restart: "always",
        labels: { "depker.version": VERSION },
        volumes: [`${VOLUMES.CONFIG}:/config`],
      });
      logger.debug(`Remote config container init successfully.`);
    };

    const _ensure = async () => {
      const find = await docker.containers.find(NAMES.CONFIG);
      if (!find) {
        await _init();
      } else {
        const state = find.State;
        const match = find.Labels.match(/depker\.version=(\d+\.\d+\.\d+)/);
        if (state !== "running" || match?.[1] !== VERSION) {
          await docker.containers.remove(NAMES.CONFIG, true);
          await _init();
        }
      }
    };

    const _read = async (): Promise<RemoteConfig> => {
      if (this._remote) {
        logger.debug(`Remote config already loaded, using cache.`);
        return this._remote;
      } else {
        const content = await docker.containers.output(NAMES.CONFIG, [`depker`, `config`, `read`]);
        const config = YAML.parse(content);
        this._remote = config;
        logger.debug(`Remote config loading successfully.`);
        return config;
      }
    };

    const _write = async (config: RemoteConfig): Promise<RemoteConfig> => {
      const content = YAML.stringify(config);
      await docker.containers.input(NAMES.CONFIG, [`depker`, `config`, `write`], content);
      this._remote = config;
      logger.debug(`Remote config written successfully.`);
      return config;
    };

    if (!this._remote) {
      await _ensure();
    }

    if (config) {
      return _write(config);
    } else {
      return _read();
    }
  }
}
