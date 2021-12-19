import { ClientConfig } from "../../config/config";

export interface NodejsConfig extends ClientConfig {
  nodejs?: {
    version?: string;
    inject_prepare?: string | string[];
    inject?: string | string[];
    cmd?: string | string[];
  };
}
