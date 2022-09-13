import { Injectable, OnModuleInit } from "@nestjs/common";
import { DockerService } from "./docker.service";
import { Build } from "../entities/build.entity";
import { BuildLogService } from "./build-log.service";
import { StorageService } from "./storage.service";
import { PassThrough } from "stream";
import { LINUX_DIR } from "../constants/dir.constant";
import { AppService } from "./app.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class DeployService implements OnModuleInit {
  constructor(
    private readonly dockerService: DockerService,
    private readonly logService: BuildLogService,
    private readonly storageService: StorageService,
    private readonly appService: AppService,
    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>
  ) {}

  public async build(build: Build) {
    const app = build.app;
    const tag = `depker-${app.name}:${Date.now()}`;
    const commands: string[] = [`DOCKER_BUILDKIT=1`, `docker`, `build`];

    // base
    commands.push(`--file=${app.dockerfile}`);
    commands.push(`--tag=${tag}`);
    if (app.pull === "always") {
      commands.push(`--pull`);
    }
    if (build.force) {
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
    commands.push(".");

    // log
    await this.logService.log(build, `build image with tag: ${tag}`);

    // checkout code
    const dir = await this.storageService.project(build);
    const sec = await this.storageService.secrets(build);

    // output
    const pass = new PassThrough({ encoding: "utf-8" });
    pass.on("data", (chunk) => {
      this.logService.log(build, chunk);
    });

    // build image
    await this.dockerService.pullImage("docker:cli");
    const [result] = await this.dockerService.run(
      "docker:cli",
      [`sh`, `-c`, commands.join(" ")],
      pass,
      {
        WorkingDir: "/app",
        HostConfig: {
          AutoRemove: true,
          Binds: [
            `${LINUX_DIR(sec)}:/sec`,
            `${LINUX_DIR(dir)}:/app`,
            `/var/run/docker.sock:/var/run/docker.sock`,
          ],
        },
      }
    );
    if (result.StatusCode === 0) {
      console.log("build success");
    } else {
      console.log("build failed");
    }

    return tag;
  }

  async onModuleInit() {
    const build = await this.buildRepository.findOne({
      where: {
        id: 1,
      },
      relations: {
        app: {
          secrets: true,
          volumes: true,
          exposes: true,
          builds: true,
        },
      },
    });
    if (!build) {
      return;
    }
    await this.build(build);
  }
}
