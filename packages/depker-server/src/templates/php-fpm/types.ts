import { NginxConfig } from "../nginx/types";
import { PHPConfig } from "../php/types";

export interface PHPFpmConfig extends NginxConfig, PHPConfig {}
