import { BaseEntity, CreateDateColumn, Entity, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity()
@Unique(["name"])
@Unique(["token"])
export class Token extends BaseEntity {
  @PrimaryColumn({ length: 128, nullable: false })
  name: string;

  @PrimaryColumn({ length: 128, nullable: false })
  token: string;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
