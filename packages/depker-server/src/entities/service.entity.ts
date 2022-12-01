import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Deploy } from "./deploy.entity";

export type ServiceType = "app" | "job";

export type ServiceStatus = "stopped" | "running" | "restarting" | "exited";

export type ServiceRestart = "no" | "always" | "on-failure";

export type ServiceMiddleware = {
  name: string;
  type: string;
  options: Record<string, string>;
};

export type ServiceHealthCheck = {
  cmd?: string[];
  retries?: number;
  interval?: number;
  start?: number;
  timeout?: number;
};

export type ServiceLabel = {
  name: string;
  value: string;
  onbuild: boolean;
};

export type ServiceSecret = {
  name: string;
  value: string;
  onbuild: boolean;
};

export type ServiceHost = {
  name: string;
  value: string;
  onbuild: boolean;
};

export type ServicePort = {
  proto: "tcp" | "udp";
  hport: number;
  cport: number;
};

export type ServiceVolume = {
  hpath: string;
  cpath: string;
  readonly: boolean;
};

@Entity()
@Unique(["name"])
export class Service extends BaseEntity {
  @PrimaryColumn({ length: 128, nullable: false })
  name: string;

  @Column({ length: 50, nullable: false })
  type: ServiceType;

  @Column({ length: 128, nullable: false })
  buildpack: string;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  commands: string[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  entrypoints: string[];

  @Column({ nullable: false, default: "always" })
  restart: ServiceRestart;

  @Column({ nullable: false, default: true })
  pull: boolean;

  // web
  @Column({ nullable: false, default: "[]", type: "simple-json" })
  domain: string[];

  @Column({ nullable: false, default: "", type: "text" })
  rule: string;

  @Column({ nullable: false, default: 3000 })
  port: number;

  @Column({ nullable: false, default: "http" })
  scheme: string;

  @Column({ nullable: false, default: false })
  tls: boolean;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  middlewares: ServiceMiddleware[];

  // healthcheck
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  healthcheck: ServiceHealthCheck;

  // extensions
  @Column({ nullable: false, default: false })
  init: boolean;

  @Column({ nullable: false, default: false })
  rm: boolean;

  @Column({ nullable: false, default: false })
  privileged: boolean;

  @Column({ nullable: false, default: "" })
  user: string;

  @Column({ nullable: false, default: "" })
  workdir: string;

  // values
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  buildArgs: Record<string, string>;

  @Column({ nullable: false, default: "{}", type: "simple-json" })
  networks: Record<string, string>;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  labels: ServiceLabel[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  secrets: ServiceSecret[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  hosts: ServiceHost[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  ports: ServicePort[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  volumes: ServiceVolume[];

  // extensions
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  extensions: Record<string, any>;

  // deploy
  @OneToMany(() => Deploy, (deploy) => deploy.service, {
    cascade: false,
    persistence: false,
  })
  deploys: Relation<Deploy[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // method
  public get view() {
    return {
      name: this.name,
      type: this.type,
      buildpack: this.buildpack,
      commands: this.commands,
      entrypoints: this.entrypoints,
      restart: this.restart,
      pull: this.pull,
      domain: this.domain,
      rule: this.rule,
      port: this.port,
      scheme: this.scheme,
      tls: this.tls,
      middlewares: this.middlewares,
      healthcheck: this.healthcheck,
      init: this.init,
      rm: this.rm,
      privileged: this.privileged,
      user: this.user,
      workdir: this.workdir,
      buildArgs: this.buildArgs,
      networks: this.networks,
      labels: this.labels,
      secrets: this.secrets,
      hosts: this.hosts,
      ports: this.ports,
      volumes: this.volumes,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      extensions: this.extensions,
    };
  }

  // repository
  public static async listDeploydAt(names: string[]): Promise<Record<string, Date>> {
    const items = await Deploy.createQueryBuilder()
      .select(["service_name AS serviceName", "MAX(updated_at) AS updatedAt"])
      .where(`status = 'success' AND service_name IN (${names.map((i) => `'${i}'`).join(",")})`)
      .groupBy("service_name")
      .getRawMany<{ serviceName: string; updatedAt: string }>();
    return items.reduce((a, i) => ({ ...a, [i.serviceName]: new Date(i.updatedAt) }), {});
  }
}
