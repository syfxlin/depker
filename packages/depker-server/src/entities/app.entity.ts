import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Deploy } from "./deploy.entity";
import { PortBind } from "./port-bind.entity";
import { VolumeBind } from "./volume-bind.entity";

export type AppRestart = "no" | "always" | "on-failure";

export type AppStatus = "stopped" | "running" | "restarting" | "exited";

export type AppMiddleware = {
  name: string;
  type: string;
  options: Record<string, string>;
};

export type AppHealthCheck = {
  cmd?: string[];
  retries?: number;
  interval?: number;
  start?: number;
  timeout?: number;
};

export type AppLabel = {
  name: string;
  value: string;
  onbuild: boolean;
};

export type AppSecret = {
  name: string;
  value: string;
  onbuild: boolean;
};

export type AppHost = {
  name: string;
  value: string;
  onbuild: boolean;
};

@Entity()
export class App extends BaseEntity {
  @PrimaryColumn({ length: 128, nullable: false, unique: true })
  name: string;

  @Column({ length: 128, nullable: false })
  buildpack: string;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  commands: string[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  entrypoints: string[];

  @Column({ nullable: false, default: "always" })
  restart: AppRestart;

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
  middlewares: AppMiddleware[];

  // healthcheck
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  healthcheck: AppHealthCheck;

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
  labels: AppLabel[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  secrets: AppSecret[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  hosts: AppHost[];

  // extensions
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  extensions: Record<string, any>;

  // relations
  @OneToMany(() => PortBind, (bind) => bind.app)
  ports: Relation<PortBind[]>;

  @OneToMany(() => VolumeBind, (bind) => bind.app)
  volumes: Relation<VolumeBind[]>;

  // deploy
  @OneToMany(() => Deploy, (deploy) => deploy.app)
  deploys: Relation<Deploy[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // repository
  public static async listDeploydAt(names: string[]): Promise<Record<string, Date>> {
    const items = await Deploy.createQueryBuilder()
      .select(["app_name AS appName", "MAX(updated_at) AS updatedAt"])
      .where(`status = 'success' AND app_name IN (${names.map((i) => `'${i}'`).join(",")})`)
      .groupBy("app_name")
      .getRawMany<{ appName: string; updatedAt: string }>();
    return items.reduce((a, i) => ({ ...a, [i.appName]: new Date(i.updatedAt) }), {});
  }
}
