import { NginxConfig } from "../nginx/types";
import { NodejsConfig } from "../nodejs/types";

export interface NodejsStaticConfig extends NginxConfig, NodejsConfig {
  nodejs?: {
    version?: string;
    inject_prepare?: string | string[];
    inject_prebuild?: string;
    inject?: string | string[];
    cmd?: string | string[];
  };
}
