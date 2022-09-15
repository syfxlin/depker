import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, Relation, UpdateDateColumn } from "typeorm";
import { Volume } from "./volume.entity";
import { Expose } from "./expose.entity";
import { Deploy } from "./deploy.entity";

@Entity()
export class App {
  @PrimaryColumn({ length: 128, nullable: false, unique: true })
  name: string;

  @Column({ length: 128, nullable: false })
  buildpark: string;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  commands: string[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  entrypoints: string[];

  @Column({ nullable: false, default: "always" })
  restart: "no" | "always" | "on-failure" | `on-failure:${number}`;

  @Column({ nullable: false, default: true })
  pull: boolean;

  @Column({ nullable: false, default: "{}", type: "simple-json" })
  extension: Record<string, any>;

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
    cmd?: string[];
    retries?: number;
    interval?: number;
    start?: number;
    timeout?: number;
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
  buildArgs: Record<string, string>;

  @Column({ nullable: false, default: "{}", type: "simple-json" })
  networks: Record<string, string>;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  labels: {
    name: string;
    value: string;
    onbuild: boolean;
  }[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  secrets: {
    name: string;
    value: string;
    onbuild: boolean;
  }[];

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  hosts: {
    name: string;
    value: string;
    onbuild: boolean;
  }[];

  // relations
  @OneToMany(() => Volume, (volume) => volume.app)
  volumes: Relation<Volume[]>;

  @OneToMany(() => Expose, (expose) => expose.app)
  exposes: Relation<Expose[]>;

  @OneToMany(() => Deploy, (deploy) => deploy.app, {
    orphanedRowAction: "delete",
  })
  deploys: Relation<Deploy[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
