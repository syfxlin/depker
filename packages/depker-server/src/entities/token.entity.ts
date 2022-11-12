import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity()
@Unique(["name"])
@Unique(["identity"])
@Index(["identity"])
export class Token extends BaseEntity {
  @PrimaryColumn({ length: 128, nullable: false })
  name: string;

  @Column({ length: 128, nullable: false })
  identity: string;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
