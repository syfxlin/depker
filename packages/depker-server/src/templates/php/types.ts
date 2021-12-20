import { ClientConfig } from "../../config/config";

export interface PHPConfig extends ClientConfig {
  php?: {
    version?: string;
    composer_version?: string;
    extensions?: string[];
    inject?: string;
    cmd?: string[] | string;
  };
}
