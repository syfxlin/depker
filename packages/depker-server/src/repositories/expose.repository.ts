import { Injectable } from "@nestjs/common";
import { Expose } from "src/entities/expose.entity";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class ExposeRepository extends Repository<Expose> {
  constructor(private dataSource: DataSource) {
    super(Expose, dataSource.createEntityManager());
  }
}
