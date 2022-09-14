import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Setting } from "../entities/setting.entity";
import { hashSync } from "bcrypt";
import deepmerge from "deepmerge";

@Injectable()
export class SettingRepository extends Repository<Setting> {
  constructor(private dataSource: DataSource) {
    super(Setting, dataSource.createEntityManager());
  }

  public async get() {
    let setting = await this.findOne({
      where: {},
      order: { id: "asc" },
    });
    if (!setting) {
      await this.insert({
        email: "admin@example.com",
        username: "admin",
        password: hashSync("password", 10),
        domain: "example.com",
      });
      setting = await this.findOne({
        where: {},
        order: { id: "asc" },
      });
    }
    return setting as Setting;
  }

  public async set(setting: Partial<Setting>) {
    const config = await this.get();
    await this.update(config.id, deepmerge(config, setting));
  }
}
