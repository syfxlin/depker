import { ConfigModule } from "@nestjs/config";
import path from "path";
import { ROOT_DIR } from "../constants/depker.constant";

export const config = ConfigModule.forRoot({
  envFilePath: [path.join(ROOT_DIR, ".env")],
});
