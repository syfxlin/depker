import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation, Unique } from "typeorm";
import { App } from "./app.entity";
import { Volume } from "./volume.entity";

@Entity()
@Unique(["app", "bind", "path"])
export class VolumeBind extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", nullable: false })
  path: string;

  @Column({ nullable: false, default: false })
  readonly: boolean;

  @ManyToOne(() => App, (app) => app.volumes, { nullable: false })
  app: Relation<App>;

  @ManyToOne(() => Volume, (port) => port.binds, { nullable: false })
  bind: Relation<Volume>;
}
