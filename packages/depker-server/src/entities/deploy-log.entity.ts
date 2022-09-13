import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Deploy } from "./deploy.entity";

@Entity()
export class DeployLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Deploy, (deploy) => deploy.logs, { nullable: false })
  deploy: Relation<Deploy>;

  @Column({ nullable: false })
  time: Date;

  @Column({ nullable: false })
  level: "debug" | "log" | "step" | "succeed" | "failed";

  @Column({ nullable: false, type: "text" })
  line: string;
}
