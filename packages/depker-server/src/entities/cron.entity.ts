import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  In,
  ManyToOne,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Service, ServiceStatus } from "../types";

@Entity()
export class Cron extends BaseEntity {
  @PrimaryColumn()
  serviceName: string;

  // service
  @ManyToOne(() => Service, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  service: Relation<Service>;

  // options
  @Column({ nullable: false })
  time: string;

  @Column({ nullable: true, type: "simple-json" })
  options: any;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  public static async status(name: string): Promise<ServiceStatus>;
  public static async status(name: string[]): Promise<Record<string, ServiceStatus>>;
  public static async status(name: string | string[]): Promise<ServiceStatus | Record<string, ServiceStatus>> {
    const names = typeof name === "string" ? [name] : name;
    const results: Record<string, ServiceStatus> = {};
    const infos = await Cron.findBy({ serviceName: In(names) });
    for (const n of names) {
      if (infos.find((i) => i.serviceName === n)) {
        results[n] = "running";
      } else {
        results[n] = "stopped";
      }
    }
    return typeof name === "string" ? results[name] : results;
  }
}
