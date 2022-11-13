import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { App } from "./app.entity";
import { Log } from "./log.entity";

export type DeployStatus = "queued" | "running" | "failed" | "success";

export type DeployTrigger = "manual" | "depker" | "git";

@Entity()
@Index(["status"])
@Index(["trigger"])
export class Deploy extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  commit: string;

  @Column({ nullable: false, default: "queued" })
  status: DeployStatus;

  @Column({ nullable: false })
  trigger: DeployTrigger;

  @ManyToOne(() => App, (app) => app.deploys, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  app: Relation<App>;

  @OneToMany(() => Log, (log) => log.deploy, {
    cascade: false,
    persistence: false,
  })
  logs: Relation<Log[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // method
  public toView() {
    return {
      id: this.id,
      app: this.app.name,
      commit: this.commit,
      status: this.status,
      trigger: this.trigger,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}
