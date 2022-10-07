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

@Entity()
@Index(["status"])
@Index(["trigger"])
export class Deploy extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  commit: string;

  @Column({ nullable: false, default: "queued" })
  status: "queued" | "running" | "failed" | "success";

  @Column({ nullable: false })
  trigger: "manual" | "depker" | "git";

  @Column({ nullable: false, default: false })
  force: boolean;

  @ManyToOne(() => App, (app) => app.deploys, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  app: Relation<App>;

  @OneToMany(() => Log, (log) => log.deploy)
  logs: Relation<Log[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
