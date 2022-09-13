import { config } from "./config/config.config";
import { http } from "./config/http.config";
import { jwt } from "./config/jwt.config";
import { schedule } from "./config/schedule.config";
import { typeorm } from "./config/typeorm.config";
import { JwtStrategy } from "./guards/jwt.strategy";
import { AuthController } from "./guards/auth.controller";

// import
export const imports = {
  imports: [config, http, jwt, schedule, typeorm],
  controllers: [AuthController],
  providers: [JwtStrategy],
};
