import { Injectable, OnModuleInit } from "@nestjs/common";
import { DockerService } from "./docker.service";
import { Deploy } from "../entities/deploy.entity";
import { DeployLogService } from "./deploy-log.service";
import { StorageService } from "./storage.service";
import { PassThrough } from "stream";
import { LINUX_DIR } from "../constants/dir.constant";
import { AppService } from "./app.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createInterface } from "readline";
import { DOCKER_IMAGE } from "../constants/docker.constant";

@Injectable()
export class DeployService implements OnModuleInit {
  constructor(
    private readonly dockerService: DockerService,
    private readonly logService: DeployLogService,
    private readonly storageService: StorageService,
    private readonly appService: AppService,
    @InjectRepository(Deploy)
    private readonly deployRepository: Repository<Deploy>
  ) {}

  public async deploy(deploy: Deploy) {
    await this.build(deploy);
  }

  public async start(deploy: Deploy) {
    const app = deploy.app;
    const tag = `depker-${app.name}:${deploy.id}`;

    // logger
    await this.logService.step(deploy, `Deployment container ${app.name} [${tag}] started.`);

    const containerInfos = await this.dockerService.listContainers({ all: true });
    const existInfos = containerInfos.filter((c) => c.Labels["depker.name"] === app.name);
    const runningInfo = existInfos.find((c) => c.Names.find((n) => n === `/${app.name}`));
  }

  public async build(deploy: Deploy) {
    const app = deploy.app;
    const tag = `depker-${app.name}:${deploy.id}`;

    // logger
    await this.logService.step(deploy, `Building image ${tag} started.`);

    // base
    const commands: string[] = [`DOCKER_BUILDKIT=1`, `docker`, `build`];
    commands.push(`--file=${app.dockerfile}`);
    commands.push(`--tag=${tag}`);
    if (app.pull === "always") {
      commands.push(`--pull`);
    }
    if (deploy.force) {
      commands.push(`--no-cache`);
    }

    // values
    for (const [k, v] of Object.entries(app.labels)) {
      commands.push(`--label=${k}=${v}`);
    }
    for (const [k, v] of Object.entries(app.buildArgs)) {
      commands.push(`--build-arg=${k}=${v}`);
    }
    for (const [k, v] of Object.entries(app.hosts)) {
      commands.push(`--add-host=${k}:${v}`);
    }

    // other
    commands.push(`--secret=id=secrets,src=/sec`);
    commands.push(`.`);

    // checkout code
    const dir = await this.storageService.project(deploy);
    const sec = await this.storageService.secrets(deploy);

    // output
    const through = new PassThrough({ encoding: "utf-8" });
    const readline = createInterface({ input: through });
    readline.on("line", (line) => {
      this.logService.log(deploy, line);
    });

    // build image
    await this.dockerService.pullImage(DOCKER_IMAGE);
    const [result] = await this.dockerService.run(DOCKER_IMAGE, [`sh`, `-c`, commands.join(" ")], through, {
      WorkingDir: "/app",
      HostConfig: {
        AutoRemove: true,
        Binds: [`${LINUX_DIR(sec)}:/sec`, `${LINUX_DIR(dir)}:/app`, `/var/run/docker.sock:/var/run/docker.sock`],
      },
    });
    if (result.StatusCode === 0) {
      deploy.status = "succeed";
      await this.deployRepository.update(deploy.id, deploy);
      await this.logService.succeed(deploy, `Building image ${tag} successful.`);
      return true;
    } else {
      deploy.status = "failed";
      await this.deployRepository.update(deploy.id, deploy);
      await this.logService.failed(deploy, `Building image ${tag} failure.`);
      return false;
    }
  }

  async onModuleInit() {
    const build = await this.deployRepository.findOne({
      where: {
        id: 1,
      },
      relations: {
        app: {
          secrets: true,
          volumes: true,
          exposes: true,
          deploys: true,
        },
      },
    });
    if (!build) {
      return;
    }
    await this.deploy(build);
  }
}
