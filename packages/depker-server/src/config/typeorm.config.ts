import { TypeOrmModule } from "@nestjs/typeorm";
import { entities } from "../app.appends";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const typeorm = TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: "better-sqlite3",
    database: "storage/database.db",
    entities: [...entities],
    logging: ["info", "warn", "error", "migration", "schema"],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
  }),
});
