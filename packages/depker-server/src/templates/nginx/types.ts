import { ClientConfig } from "../../config/config";

export interface NginxConfig extends ClientConfig {
  nginx?: {
    version?: string;
    charset?: string;
    root?: string;
    index?: string;
    error_page?: Record<string, string>;
    canonical_host?: string;
    allow_dotfile?: boolean;
    disable_cache?: boolean;
    disable_try?: boolean;
    inject?: string | string[];
  };
}
