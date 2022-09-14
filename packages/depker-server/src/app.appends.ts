import { VersionController } from "./controllers/version.controller";
import { DockerService } from "./services/docker.service";
import { StorageService } from "./services/storage.service";
import { DeployController } from "./controllers/deploy.controller";
import { DeployService } from "./services/deploy.service";
import { App } from "./entities/app.entity";
import { Volume } from "./entities/volume.entity";
import { Expose } from "./entities/expose.entity";
import { Setting } from "./entities/setting.entity";
import { TraefikTask } from "./tasks/traefik.task";
import { Deploy } from "./entities/deploy.entity";
import { GitController } from "./controllers/git.controller";
import { DeployLog } from "./entities/deploy-log.entity";
import { AppRepository } from "./repositories/app.repository";
import { VolumeRepository } from "./repositories/volume.repository";
import { ExposeRepository } from "./repositories/expose.repository";
import { SettingRepository } from "./repositories/setting.repository";
import { DeployRepository } from "./repositories/deploy.repository";
import { DeployLogRepository } from "./repositories/deploy-log.repository";

// entity
export const entities = [App, Volume, Expose, Setting, Deploy, DeployLog];
export const repositories = [
  AppRepository,
  VolumeRepository,
  ExposeRepository,
  SettingRepository,
  DeployRepository,
  DeployLogRepository,
];

// controller & service & task
export const controllers = [VersionController, GitController, DeployController];
export const services = [DeployService, DockerService, StorageService];
export const tasks = [TraefikTask];
