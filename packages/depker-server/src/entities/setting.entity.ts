import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { hashSync } from "bcrypt";
import { GetSettingResponse } from "../views/setting.view";

@Entity()
export class Setting extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column({ length: 128, nullable: false })
  email: string;

  @Column({ length: 128, nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false, default: true })
  upgrade: boolean;

  @Column({ nullable: false, default: true })
  purge: boolean;

  @Column({ nullable: false, default: 1 })
  concurrency: number;

  @Column({ nullable: false, default: `{"type": "http"}`, type: "simple-json" })
  tls: { type: string; env?: Record<string, string> };

  @Column({ nullable: false, default: "" })
  dashboard: string;

  @Column({ nullable: false, default: "[]", type: "simple-json" })
  ports: Array<number>;

  // plugins extension config
  @Column({ nullable: false, default: "{}", type: "simple-json" })
  plugins: Record<string, Record<string, any>>;

  // date
  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // method
  public get view(): GetSettingResponse {
    return {
      email: this.email,
      username: this.username,
      upgrade: this.upgrade,
      purge: this.purge,
      concurrency: this.concurrency,
      dashboard: this.dashboard,
      tls: {
        type: this.tls.type,
        env: this.tls.env,
      },
    };
  }

  // repository
  public static async read() {
    let setting = await this.findOne({
      where: { id: 1 },
      order: { id: "asc" },
    });
    if (!setting) {
      await this.upsert(
        {
          id: 1,
          email: "admin@example.com",
          username: "admin",
          password: hashSync("password", 10),
        },
        ["id"]
      );
      setting = await this.findOne({
        where: { id: 1 },
        order: { id: "asc" },
      });
    }
    return setting as Setting;
  }

  public static async write(setting: Partial<Setting>) {
    const config = await this.read();
    await this.update(config.id, setting);
  }
}
