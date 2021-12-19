import DepkerTemplate from "../template";
import { NodejsStaticConfig } from "./types";
import { $choose, $if, $inject } from "../../utils/template";
import { nginxConf } from "../nginx/nginx.conf";
import dedent from "dedent";

export default class NodejsStaticTemplate extends DepkerTemplate<NodejsStaticConfig> {
  public get name(): string {
    return "nodejs-static";
  }

  public async check() {
    return (
      this.ctx.existsFile("package.json") && this.ctx.existsFile(".static")
    );
  }

  public async execute() {
    if (!this.ctx.existsFile("package.json")) {
      throw new Error("Build failed! Couldn't find package.json!");
    }
    // prepare
    const version = this.ctx.config.nodejs?.version ?? "lts";
    const packageJson = this.ctx.existsFile("package.json");
    let packageType: "npm" | "pnpm" | "yarn" | "none" = packageJson
      ? "npm"
      : "none";
    if (this.ctx.existsFile("pnpm-lock.yaml")) {
      packageType = "pnpm";
    }
    if (this.ctx.existsFile("yarn.lock")) {
      packageType = "yarn";
    }

    // nginx
    const nginxVersion = $choose(this.ctx.config.nginx?.version, "mainline");
    const root = $choose(this.ctx.config.nginx?.root, "public");
    const nginxd = this.ctx.existsFile(".depker/nginx.d");
    // if exists: use custom, no-exists: use default
    this.ctx.writeFile(".depker/nginx.conf", nginxConf(this.ctx.config), false);

    // dockerfile
    // prettier-ignore
    const dockerfile = dedent`
      # from nodejs
      FROM node:${version}-alpine as builder
      
      # copy package.json and lock file
      WORKDIR /app
      ${$if(packageType === "pnpm", `
        COPY package.json pnpm-lock.yaml ./
      `)}
      ${$if(packageType === "yarn", `
        COPY package.json yarn.lock ./
      `)}
      ${$if(packageType === "npm", `
        COPY package*.json ./
      `)}
      
      # inject prepare
      ${$inject(this.ctx.config.nodejs?.inject_prepare)}
      
      # install node modules
      ${$if(packageType === "pnpm", `
        RUN npm i -g pnpm
        RUN pnpm install --prod --frozen-lockfile
      `)}
      ${$if(packageType === "yarn", `
        RUN yarn install --production --frozen-lockfile && yarn cache clean
      `)}
      ${$if(packageType === "npm", `
        RUN npm ${this.ctx.existsFile("package-lock.json") ? "ci" : "install"} --only=production && npm cache clean --force
      `)}

      # copy project
      COPY . .
      
      # inject prebuild
      ${$inject(this.ctx.config.nodejs?.inject_prebuild)}
      
      # build nodejs
      ${$if(packageType === "pnpm", `
        RUN pnpm run build
      `)}
      ${$if(packageType === "yarn", `
        RUN yarn run build
      `)}
      ${$if(packageType === "npm", `
        RUN npm run build
      `)}
      
      # inject
      ${$inject(this.ctx.config.nodejs?.inject)}

      # from nginx
      FROM nginx:${nginxVersion}-alpine
      
      # config
      COPY --from=builder /app/.depker/nginx.conf /etc/nginx/nginx.conf
      ${$if(nginxd, `
        COPY --from=builder /app/.depker/nginx.d/ /etc/nginx/conf.d/
      `)}
      
      # copy project
      WORKDIR /app
      COPY --from=builder /app/${root} ./${root}
      
      # inject
      ${$inject(this.ctx.config.nginx?.inject)}
    `;
    this.ctx.dockerfile(dockerfile);

    // build & start
    const image = await this.ctx.build();
    await this.ctx.start(image);
  }
}
