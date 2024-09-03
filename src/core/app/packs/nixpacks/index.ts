import { AppConfig } from "../../index.ts";
import { pack } from "../../ctx.ts";
import { DockerNode } from "../../../../providers/docker.ts";
import dotenv from "../../../../deps/std/dotenv.ts";

export interface NixpacksConfig extends AppConfig {
  nixpacks?: {
    install_cmd?: string;
    build_cmd?: string;
    start_cmd?: string;
    config?: string;
    apts?: string[];
    pkgs?: string[];
    libs?: string[];
  };
}

export const nixpacks = pack<NixpacksConfig>({
  build: async (ctx) => {
    const image = `depker/${ctx.config.name}:${ctx.id}`;
    const depker = ctx.depker;
    const config = ctx.config;
    const runner = depker.runner();
    if (!(runner instanceof DockerNode)) {
      throw new TypeError(`To build an image with nixpacks, you must set the runner to docker.`);
    }

    // build
    const args: string[] = [`--name`, image];
    if (config.cache === false) {
      args.push(`--no-cache`);
    }
    if (config.secrets || config.labels) {
      const dotenvs = await dotenv.load();
      const secrets = await depker.config.secret(config.name);
      const placeholder = (value: string) => {
        // noinspection RegExpRedundantEscape
        return value.replace(/(?<=^|[^@])(?:@([a-z]\w*)|@\{([a-z][a-z0-9]*)\})/gi, (a, n) => {
          const r = dotenvs[n] ?? secrets[n];
          return r === null || r === undefined ? a : String(r);
        });
      };
      if (config.secrets) {
        for (const [key, val] of Object.entries(config.secrets)) {
          args.push(`--env`);
          args.push(`${key}=${placeholder(val)}`);
        }
      }
      if (config.labels) {
        for (const [key, val] of Object.entries(config.labels)) {
          args.push(`--label`);
          args.push(`${key}=${placeholder(val)}`);
        }
      }
    }
    if (config.nixpacks?.install_cmd) {
      args.push(`--install-cmd`);
      args.push(config.nixpacks.install_cmd);
    }
    if (config.nixpacks?.build_cmd) {
      args.push(`--build-cmd`);
      args.push(config.nixpacks.build_cmd);
    }
    if (config.nixpacks?.start_cmd) {
      args.push(`--start-cmd`);
      args.push(config.nixpacks.start_cmd);
    }
    if (config.nixpacks?.config) {
      args.push(`--config`);
      args.push(config.nixpacks.config);
    }
    for (const apt of config.nixpacks?.apts ?? []) {
      args.push(`--apt`);
      args.push(apt);
    }
    for (const pkg of config.nixpacks?.pkgs ?? []) {
      args.push(`--pkgs`);
      args.push(pkg);
    }
    for (const lib of config.nixpacks?.libs ?? []) {
      args.push(`--libs`);
      args.push(lib);
    }
    await depker.exec`nixpacks build ${ctx.target} ${args}`.env(runner.env).stdout("inherit").stderr("inherit");

    // start
    config.$$image = image;
    await ctx.start();
  },
});
