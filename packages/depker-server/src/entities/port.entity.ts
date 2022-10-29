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
import { PortBind } from "./port-bind.entity";

export type PortProtocol = "tcp" | "udp";

@Entity()
@Index(["port"])
@Index(["proto"])
@Unique(["proto", "port"])
export class Port extends BaseEntity {
  @PrimaryColumn({ length: 128, nullable: false })
  name: string;

  @Column({ nullable: false, default: "tcp" })
  proto: PortProtocol;

  @Column({ nullable: false })
  port: number;

  @OneToMany(() => PortBind, (bind) => bind.bind)
  binds: Relation<PortBind[]>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
