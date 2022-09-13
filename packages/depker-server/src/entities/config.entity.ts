import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128, nullable: false })
  email: string;

  @Column({ length: 128, nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  domain: string;

  @Column({ nullable: false, default: false })
  debug: boolean;

  @Column({ nullable: false, default: "{}", type: "simple-json" })
  traefik: {
    image?: string;
    tls?: "http" | string;
    dashboard?: string;
    envs?: Record<string, string>;
    labels?: Record<string, string>;
    ports?: string[];
  };

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
