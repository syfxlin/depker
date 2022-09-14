import { Injectable } from "@nestjs/common";
import { Volume } from "src/entities/volume.entity";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class VolumeRepository extends Repository<Volume> {
  constructor(private dataSource: DataSource) {
    super(Volume, dataSource.createEntityManager());
  }
}
