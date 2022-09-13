import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Secret } from "./secret.entity";
import { Volume } from "./volume.entity";
import { Expose } from "./expose.entity";
import { Build } from "./build.entity";

@Entity()
@Index(["name"], { unique: true })
@Unique(["name"])
export class App {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128, nullable: false })
  name: string;

  @Column({ length: 128, nullable: false })
  buildpark: string;

  @Column({ nullable: false, default: "Dockerfile" })
  dockerfile: string;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  commands: string[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  entrypoints: string[];

  @Column({ nullable: false, default: "always" })
  restart: "no" | "always" | "on-failure" | `on-failure:${number}`;

  @Column({ nullable: false, default: "always" })
  pull: "always" | "missing" | "never";

  @Column({ nullable: false, default: 1 })
  replica: number;

  @Column({ nullable: false, default: "{}", type: "simple-json" })
  extension: any;

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
  middlewares: {
    name: string;
    type: string;
    options: Record<string, string>;
  }[];

  // healthcheck
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  healthcheck: {
    cmd?: string;
    retries?: number;
    interval?: string;
    start?: string;
    timeout?: string;
  };

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
  labels: Record<string, string>;

  @Column({ nullable: false, default: "{}", type: "simple-json" })
  buildArgs: Record<string, string>;

  @Column({ nullable: false, default: "{}", type: "simple-json" })
  hosts: Record<string, string>;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  networks: string[];

  // relations
  @OneToMany(() => Secret, (secret) => secret.app, {
    orphanedRowAction: "delete",
  })
  secrets: Relation<Secret[]>;

  @OneToMany(() => Volume, (volume) => volume.app, {
    orphanedRowAction: "delete",
  })
  volumes: Relation<Volume[]>;

  @OneToMany(() => Expose, (expose) => expose.app, {
    orphanedRowAction: "delete",
  })
  exposes: Relation<Expose[]>;

  @OneToMany(() => Build, (build) => build.app, {
    orphanedRowAction: "delete",
  })
  builds: Relation<Build[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
