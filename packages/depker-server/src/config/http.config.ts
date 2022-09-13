import { HttpModule } from "nestjs-http-promise";

export const http = HttpModule.register({
  retries: 5,
  timeout: 10_000,
  maxRedirects: 10,
});
