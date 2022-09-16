import { DockerService } from "./services/docker.service";
import { StorageService } from "./services/storage.service";
import { DeployController } from "./controllers/deploy.controller";
import { DeployService } from "./services/deploy.service";
import { App } from "./entities/app.entity";
import { Volume } from "./entities/volume.entity";
import { Port } from "./entities/port.entity";
import { Setting } from "./entities/setting.entity";
import { TraefikTask } from "./tasks/traefik.task";
import { Deploy } from "./entities/deploy.entity";
import { GitController } from "./controllers/git.controller";
import { Log } from "./entities/log.entity";
import { HealthController } from "./controllers/health.controller";
import { DeployTask } from "./tasks/deploy.task";
import { InfoController } from "./controllers/info.controller";
import { Token } from "./entities/token.entity";
import { AppController } from "./controllers/app.controller";
import { PortBind } from "./entities/port-bind.entity";
import { VolumeBind } from "./entities/volume-bind.entity";

// entity
export const entities = [Setting, Token, App, Deploy, Log, Volume, Port, PortBind, VolumeBind];

// controller & service & task
export const controllers = [HealthController, InfoController, GitController, DeployController, AppController];
export const services = [DeployService, DockerService, StorageService];
export const tasks = [TraefikTask, DeployTask];
