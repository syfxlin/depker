import pino from "pino";
import { config } from "../config/config";

export const $logger = pino({
  level: config.debug ? "debug" : "info",
});
