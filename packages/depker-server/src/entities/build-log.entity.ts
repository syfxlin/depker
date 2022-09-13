import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Build } from "./build.entity";

@Entity()
export class BuildLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Build, (build) => build.logs)
  build: Relation<Build>;

  @Column({ nullable: false, default: "", type: "text" })
  line: string;

  @Column({ nullable: false })
  time: Date;
}
