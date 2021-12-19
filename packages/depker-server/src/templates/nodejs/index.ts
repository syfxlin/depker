import DepkerTemplate from "../template";
import { NodejsConfig } from "./types";
import dedent from "dedent";
import { $cmd, $if, $inject } from "../../utils/template";

export default class NodejsTemplate extends DepkerTemplate<NodejsConfig> {
  public get name(): string {
    return "nodejs";
  }

  public async check() {
    if (this.ctx.existsFile("index.js")) {
      return true;
    }
    if (this.ctx.existsFile("server.js")) {
      return true;
    }
    if (this.ctx.existsFile("app.js")) {
      return true;
    }
    if (this.ctx.existsFile("main.js")) {
      return true;
    }
    return this.ctx.existsFile("package.json");
  }

  public async execute() {
    if (!(await this.check())) {
      throw new Error(
        "Build failed! Couldn't find nodejs script (package.json, server.js, app.js, main.js, index.js)!"
      );
    }
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
    // prettier-ignore
    const dockerfile = dedent`
      # from nodejs
      FROM node:${version}-alpine
      
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
      
      # inject nodejs
      ${$inject(this.ctx.config.nodejs?.inject)}
      
      # set cmd
      ${$if(this.ctx.config.nodejs?.cmd, `
        ${$cmd(this.ctx.config.nodejs?.cmd)}
      `, `
        ${$if(packageType === "pnpm", `
          CMD ["pnpm", "run", "start"]
        `)}
        ${$if(packageType === "yarn", `
          CMD ["yarn", "run", "start"]
        `)}
        ${$if(packageType === "npm", `
          CMD ["npm", "run", "start"]
        `)}
        
        ${$if(packageType === "none" && this.ctx.existsFile("server.js"), `
          CMD ["node", "server.js"]
        `)}
        ${$if(packageType === "none" && this.ctx.existsFile("app.js"), `
          CMD ["node", "app.js"]
        `)}
        ${$if(packageType === "none" && this.ctx.existsFile("main.js"), `
          CMD ["node", "main.js"]
        `)}
        ${$if(packageType === "none" && this.ctx.existsFile("index.js"), `
          CMD ["node", "index.js"]
        `)}
      `)}
    `;
    this.ctx.dockerfile(dockerfile);

    const image = await this.ctx.build();
    await this.ctx.start(image);
  }
}
