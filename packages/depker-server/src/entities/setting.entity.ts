import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

  @Column({ nullable: false, default: 1 })
  concurrency: number;

  @Column({ nullable: false, default: true })
  upgrade: boolean;

  @Column({ nullable: false, default: `{"type": "http"}`, type: "simple-json" })
  tls: { type: string; env?: Record<string, string> };

  @Column({ nullable: false, default: "" })
  dashboard: string;

  @Column({ nullable: false, default: "[9000, 9100]", type: "simple-json" })
  ports: [number, number];

  // extension
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  extension: {
    traefik?: any;
    dashboard?: any;
  };

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;
}
