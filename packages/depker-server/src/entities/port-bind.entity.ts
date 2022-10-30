import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn, Relation, Unique } from "typeorm";
import { App } from "./app.entity";
import { Port } from "./port.entity";

@Entity()
@Unique(["app", "bind", "port"])
export class PortBind extends BaseEntity {
  @PrimaryColumn({ name: "app_name" })
  appName: string;

  @PrimaryColumn({ name: "bind_name" })
  bindName: string;

  @ManyToOne(() => App, (app) => app.ports, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  app: Relation<App>;

  @ManyToOne(() => Port, (port) => port.binds, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  bind: Relation<Port>;

  @Column({ nullable: false })
  port: number;
}
