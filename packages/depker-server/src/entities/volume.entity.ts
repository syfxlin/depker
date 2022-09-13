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
export class Volume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128, nullable: false })
  name: string;

  @Column({ type: "text", nullable: false })
  src: string;

  @Column({ type: "text", nullable: false })
  dst: string;

  @Column({ nullable: false, default: false })
  readonly: boolean;

  @ManyToOne(() => App, (app) => app.volumes, { nullable: false })
  app: Relation<App>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
