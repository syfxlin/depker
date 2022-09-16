import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation, Unique } from "typeorm";
import { App } from "./app.entity";
import { Port } from "./port.entity";

@Entity()
@Unique(["app", "bind", "port"])
export class PortBind extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  port: number;

  @ManyToOne(() => App, (app) => app.ports, { nullable: false })
  app: Relation<App>;

  @ManyToOne(() => Port, (port) => port.binds, { nullable: false })
  bind: Relation<Port>;
}
