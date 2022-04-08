import exec from "./exec.ts";
import * as config from "./config.ts";
import * as tmp from "./tmp.ts";
import * as text from "./text.ts";
import * as git from "./git.ts";
import * as docker from "./docker.ts";
import * as compose from "./docker-compose.ts";
import * as template from "../templates/index.ts";

// libs
export * from "./libs.ts";

// extensions
export { exec, config, tmp, text, git, docker, compose, template };
