import { DataSource, Repository } from "typeorm";
import { App } from "../entities/app.entity";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppRepository extends Repository<App> {
  constructor(private dataSource: DataSource) {
    super(App, dataSource.createEntityManager());
  }

  public async findByName(name: string) {
    return this.find({ where: { name } });
  }
}
