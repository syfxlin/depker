import { DockerService } from "./services/docker.service";
import { StorageService } from "./services/storage.service";
import { DeployService } from "./services/deploy.service";
import { App } from "./entities/app.entity";
import { Setting } from "./entities/setting.entity";
import { TraefikTask } from "./tasks/traefik.task";
import { Deploy } from "./entities/deploy.entity";
import { GitController } from "./controllers/git.controller";
import { Log } from "./entities/log.entity";
import { DeployTask } from "./tasks/deploy.task";
import { SystemController } from "./controllers/system.controller";
import { Token } from "./entities/token.entity";
import { AppController } from "./controllers/app.controller";
import { AssetController } from "./controllers/asset.controller";
import { PortController } from "./controllers/port.controller";
import { VolumeController } from "./controllers/volume.controller";
import { BuildpackController } from "./controllers/buildpack.controller";
import { TerminalGateway } from "./ws/terminal.gateway";
import { FileController } from "./controllers/file.controller";
import { TokenController } from "./controllers/token.controller";
import { LogsGateway } from "./ws/logs.gateway";
import { AccessLogsGateway } from "./ws/access-logs.gateway";

// entity
export const entities = [Setting, Token, App, Deploy, Log];

// controller & service & task
export const controllers = [
  SystemController,
  AssetController,
  GitController,
  AppController,
  PortController,
  VolumeController,
  BuildpackController,
  FileController,
  TokenController,
];
export const gateways = [TerminalGateway, LogsGateway, AccessLogsGateway];
export const services = [DeployService, DockerService, StorageService];
export const tasks = [TraefikTask, DeployTask];
