import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { App } from "../entities/app.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(App)
    private readonly repository: Repository<App>
  ) {}

  public async findByName(name: string) {
    return this.repository.findOne({
      where: { name },
    });
  }
}
