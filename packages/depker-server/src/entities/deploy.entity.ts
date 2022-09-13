import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { App } from "./app.entity";
import { DeployLog } from "./deploy-log.entity";

@Entity()
export class Deploy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  trigger: "manual" | "depker" | "git";

  @Column({ nullable: false, default: "queued" })
  status: "queued" | "running" | "failed" | "succeed";

  @Column({ nullable: false, default: false })
  force: boolean;

  @Column({ nullable: false })
  commit: string;

  @ManyToOne(() => App, (app) => app.deploys, { nullable: false })
  app: Relation<App>;

  @OneToMany(() => DeployLog, (log) => log.deploy)
  logs: Relation<DeployLog[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
