import { Injectable } from "@nestjs/common";
import { DockerService } from "./docker.service";
import { Deploy } from "../entities/deploy.entity";
import { StorageService } from "./storage.service";
import { In, LessThan, Not } from "typeorm";
import pAll from "p-all";
import { PluginService } from "./plugin.service";
import { PackContext } from "../plugins/pack.context";
import { Setting } from "../entities/setting.entity";
import { Log } from "../entities/log.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { HttpService } from "nestjs-http-promise";
import { AuthService } from "../guards/auth.service";
import { SchedulerRegistry } from "@nestjs/schedule";

@Injectable()
export class DeployService {
  constructor(
    private readonly docker: DockerService,
    private readonly https: HttpService,
    private readonly events: EventEmitter2,
    private readonly schedules: SchedulerRegistry,
    private readonly storages: StorageService,
    private readonly plugins: PluginService,
    private readonly auths: AuthService
  ) {}

  public async task() {
    const setting = await Setting.read();
    const deploys = await Deploy.find({
      where: {
        status: In(["queued", "running"]),
      },
      order: {
        createdAt: "asc",
      },
      relations: {
        app: true,
      },
    });

    if (!deploys.length) {
      return;
    }

    const actions = deploys.map((deploy) => async () => {
      const app = deploy.app;
      try {
        // if status equal running, explain that deploy is interrupted during execution, restart
        if (deploy.status === "running") {
          await Log.step(deploy, `Building halted, restarting...`);
        }

        // stop old deploys
        if (setting.concurrency === 1) {
          await Deploy.update(
            {
              app: {
                name: Not(app.name),
              },
              id: Not(deploy.id),
              status: In(["queued", "running"]),
              createdAt: LessThan(new Date(Date.now() - 10 * 1000)),
            },
            {
              status: "failed",
            }
          );
        }

        // log started
        await Log.step(deploy, `Deployment app ${app.name} started.`);

        // update status to running
        await Deploy.update(deploy.id, { status: "running" });

        // deploy container
        await this.deploy(deploy);

        // purge containers
        await this.purge(deploy);

        // update status to success
        await Deploy.update(deploy.id, { status: "success" });

        // log successful
        await Log.success(deploy, `Deployment app ${app.name} successful.`);
      } catch (e: any) {
        // update status to failed
        await Deploy.update(
          {
            id: deploy.id,
            status: In(["queued", "running"]),
          },
          {
            status: "failed",
          }
        );

        // save failed logs
        await Log.error(deploy, `Deployment app ${app.name} failure. Caused by ${e}.`);
      }
    });

    await pAll(actions, { concurrency: setting.concurrency });
  }

  public async deploy(deploy: Deploy) {
    // values
    const app = deploy.app;

    // find buildpack
    const buildpack = (await this.plugins.buildpacks())[app.buildpack];
    if (!buildpack?.buildpack?.handler) {
      throw new Error(`Not found buildpack ${app.buildpack}`);
    }

    // init project
    const project = await this.storages.project(app.name, deploy.commit);

    // init context
    const context = new PackContext({
      name: buildpack.name,
      deploy: deploy,
      project: project,
      plugins: this.plugins,
      docker: this.docker,
      https: this.https,
      events: this.events,
      schedules: this.schedules,
      storages: this.storages,
      auths: this.auths,
    });

    // deployment containers
    await buildpack.buildpack.handler(context);
  }

  public async purge(deploy: Deploy) {
    // values
    const app = deploy.app;

    // logger
    await Log.step(deploy, `Purge ${app.name} containers started.`);

    // purge container
    const infos = await this.docker.listContainers({ all: true });
    const containers = infos.filter((c) => c.Labels["depker.name"] === app.name && !c.Names.includes(`/${app.name}`));
    for (const info of containers) {
      const container = this.docker.getContainer(info.Id);
      try {
        await container.remove({ force: true });
      } catch (e: any) {
        if (e.statusCode === 404) {
          return;
        }
        await Log.error(deploy, `Purge container ${container.id} failed.`, e);
      }
    }

    // purge images and volumes
    process.nextTick(async () => {
      const setting = await Setting.read();
      if (setting.purge) {
        await Promise.all([this.docker.pruneImages(), this.docker.pruneVolumes()]);
      }
    });
  }
}
