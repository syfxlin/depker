import { ConfigModule } from "@nestjs/config";

export const config = ConfigModule.forRoot({
  envFilePath: ["storage/.env"],
});
