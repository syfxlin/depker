import fs from "fs-extra";
import { IMAGES, NAMES, VOLUMES } from "../constants/depker.constant";
import { LocalConfig, RemoteConfig } from "../types/config.type";
import { docker, logger } from "../bin";
import YAML from "yaml";
import { Command } from "commander";

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
      const find = await docker.containers.find(NAMES.CONFIG);
      if (!find) {
        await docker.containers.run(NAMES.CONFIG, IMAGES.CONFIG, {
          detach: true,
          restart: "always",
          volumes: [`${VOLUMES.CONFIG}:/config`],
        });
        logger.debug(`Remote config container init successfully.`);
      }
      if (find && find.State !== "running") {
        await docker.containers.start(NAMES.CONFIG);
        logger.debug(`Remote config container start successfully.`);
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
      await _init();
    }

    if (config) {
      return _write(config);
    } else {
      return _read();
    }
  }
}
