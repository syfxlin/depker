import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Setting } from "../entities/config.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { hashSync } from "bcrypt";
import deepmerge from "deepmerge";

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly repository: Repository<Setting>
  ) {}

  public async get() {
    let setting = await this.repository.findOne({
      where: {},
      order: { id: "asc" },
    });
    if (!setting) {
      await this.repository.insert({
        email: "admin@example.com",
        username: "admin",
        password: hashSync("password", 10),
        domain: "example.com",
      });
      setting = await this.repository.findOne({
        where: {},
        order: { id: "asc" },
      });
    }
    return setting as Setting;
  }

  public async set(setting: Partial<Setting>) {
    const config = await this.get();
    await this.repository.update(config.id, deepmerge(config, setting));
  }
}
