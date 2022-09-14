import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Deploy } from "../entities/deploy.entity";

@Injectable()
export class DeployRepository extends Repository<Deploy> {
  constructor(private dataSource: DataSource) {
    super(Deploy, dataSource.createEntityManager());
  }
}
