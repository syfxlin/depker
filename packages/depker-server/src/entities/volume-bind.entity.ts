import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn, Relation, Unique } from "typeorm";
import { App } from "./app.entity";
import { Volume } from "./volume.entity";

@Entity()
@Unique(["app", "bind", "path"])
export class VolumeBind extends BaseEntity {
  @PrimaryColumn({ name: "app_name" })
  appName: string;

  @PrimaryColumn({ name: "bind_name" })
  bindName: string;

  @ManyToOne(() => App, (app) => app.volumes, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  app: Relation<App>;

  @ManyToOne(() => Volume, (port) => port.binds, {
    nullable: false,
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    cascade: false,
    persistence: false,
  })
  bind: Relation<Volume>;

  @Column({ type: "text", nullable: false })
  path: string;

  @Column({ nullable: false, default: false })
  readonly: boolean;
}
