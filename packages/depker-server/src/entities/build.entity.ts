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
import { BuildLog } from "./build-log.entity";

@Entity()
export class Build {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  trigger: "manual" | "depker" | "git";

  @Column({ nullable: false, default: "queued" })
  status: "queued" | "running" | "failed" | "success";

  @Column({ nullable: false, default: false })
  force: boolean;

  @Column({ nullable: false })
  commit: string;

  @ManyToOne(() => App, (app) => app.builds)
  app: Relation<App>;

  @OneToMany(() => BuildLog, (log) => log.build)
  logs: Relation<BuildLog[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
