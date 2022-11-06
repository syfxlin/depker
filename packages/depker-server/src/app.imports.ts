import { config } from "./config/config.config";
import { jwt } from "./config/jwt.config";
import { http } from "./config/http.config";
import { schedule } from "./config/schedule.config";
import { orm } from "./config/orm.config";
import { events } from "./config/events.config";
import { health } from "./config/health.config";
import { AuthController } from "./guards/auth.controller";
import { PluginService } from "./services/plugin.service";
import { AuthService } from "./guards/auth.service";

// import
export const imports = {
  imports: [config, http, jwt, schedule, orm, events, health],
  controllers: [AuthController],
  providers: [AuthService, PluginService],
};
