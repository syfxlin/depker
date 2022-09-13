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
@Index(["dst"], { unique: true })
@Unique(["name"])
@Unique(["dst"])
export class Expose {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128, nullable: false })
  name: string;

  @Column({ nullable: false })
  src: number;

  @Column({ nullable: false })
  dst: number;

  @Column({ nullable: false, default: "tcp" })
  protocol: string;

  @ManyToOne(() => App, (app) => app.exposes, { nullable: false })
  app: Relation<App>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
