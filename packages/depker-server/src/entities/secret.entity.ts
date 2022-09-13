import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { App } from "./app.entity";

@Entity()
@Index(["name"], { unique: true })
@Unique(["name"])
export class Secret {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128, nullable: false })
  name: string;

  @Column({ type: "text", nullable: false })
  value: string;

  @Column({ nullable: false, default: false })
  onbuild: boolean;

  @ManyToOne(() => App, (app) => app.secrets)
  app: Relation<App>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
