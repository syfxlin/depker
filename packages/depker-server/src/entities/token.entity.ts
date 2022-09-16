import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

@Entity()
@Unique(["name"])
@Unique(["token"])
export class Token extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128, nullable: false })
  name: string;

  @Column({ length: 128, nullable: false })
  token: string;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
