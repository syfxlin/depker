import { VersionController } from "./controllers/version.controller";
import { DockerService } from "./services/docker.service";
import { StorageService } from "./services/storage.service";
import { DeployController } from "./controllers/deploy.controller";
import { DeployService } from "./services/deploy.service";
import { App } from "./entities/app.entity";
import { Secret } from "./entities/secret.entity";
import { Volume } from "./entities/volume.entity";
import { Expose } from "./entities/expose.entity";
import { Setting } from "./entities/setting.entity";
import { TraefikTask } from "./tasks/traefik.task";
import { Deploy } from "./entities/deploy.entity";
import { SettingService } from "./services/setting.service";
import { GitController } from "./controllers/git.controller";
import { DeployLog } from "./entities/deploy-log.entity";
import { AppService } from "./services/app.service";
import { DeployLogService } from "./services/deploy-log.service";

// entity
export const entities = [App, Secret, Volume, Expose, Setting, Deploy, DeployLog];

// controller & service & task
export const controllers = [VersionController, GitController, DeployController];
export const services = [AppService, DeployLogService, DeployService, DockerService, StorageService, SettingService];
export const tasks = [TraefikTask];
