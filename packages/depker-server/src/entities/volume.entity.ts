import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { VolumeBind } from "./volume-bind.entity";

@Entity()
@Index(["path"])
@Index(["global"])
@Unique(["global", "path"])
export class Volume extends BaseEntity {
  @PrimaryColumn({ length: 128, nullable: false })
  name: string;

  @Column({ type: "text", nullable: false })
  path: string;

  @Column({ nullable: false, default: false })
  global: boolean;

  @OneToMany(() => VolumeBind, (bind) => bind.bind)
  binds: Relation<VolumeBind[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
