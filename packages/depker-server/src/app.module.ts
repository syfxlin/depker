import { Module } from "@nestjs/common";
import { imports } from "./app.imports";
import { controllers, entities, gateways, services, tasks } from "./app.appends";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [...imports.imports, TypeOrmModule.forFeature(entities)],
  controllers: [...imports.controllers, ...controllers],
  providers: [...imports.providers, ...gateways, ...services, ...tasks],
})
export class AppModule {}
