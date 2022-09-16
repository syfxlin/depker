import { TypeOrmModule } from "@nestjs/typeorm";
import { entities } from "../app.appends";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import path from "path";
import { PATHS } from "../constants/depker.constant";

export const orm = TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: "better-sqlite3",
    database: path.join(PATHS.CONFIG, "database.db"),
    entities: [...entities],
    logging: ["info", "warn", "error", "migration", "schema"],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
  }),
});
