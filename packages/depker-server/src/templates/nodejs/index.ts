import { DepkerTemplate } from "../template";
import { $cmd, $if, $inject, $version } from "../../utils/template";
import { NodejsConfig } from "./types";

export const name: DepkerTemplate<NodejsConfig>["name"] = "nodejs";

export const check: DepkerTemplate<NodejsConfig>["check"] = async (ctx) => {
  if (ctx.existsFile("index.js")) {
    return true;
  }
  if (ctx.existsFile("server.js")) {
    return true;
  }
  if (ctx.existsFile("app.js")) {
    return true;
  }
  if (ctx.existsFile("main.js")) {
    return true;
  }
  return ctx.existsFile("package.json");
};

export const execute: DepkerTemplate<NodejsConfig>["execute"] = async (ctx) => {
  if (!(await check(ctx))) {
    throw new Error(
      "Build failed! Couldn't find nodejs script (package.json, server.js, app.js, main.js, index.js)!"
    );
  }
  const version = $version(ctx.config.nodejs?.version);
  const packageJson = ctx.existsFile("package.json");
  let packageType: "npm" | "pnpm" | "yarn" | "none" = packageJson
    ? "npm"
    : "none";
  if (ctx.existsFile("pnpm-lock.yaml")) {
    packageType = "pnpm";
  }
  if (ctx.existsFile("yarn.lock")) {
    packageType = "yarn";
  }
  // prettier-ignore
  const dockerfile = `
    # from nodejs
    FROM node:${version.right}alpine
    
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
    ${$inject(ctx.config.nodejs?.inject_prepare)}
    
    # install node modules
    ${$if(packageType === "pnpm", `
      RUN npm i -g pnpm
      RUN pnpm install --frozen-lockfile
    `)}
    ${$if(packageType === "yarn", `
      RUN yarn install --frozen-lockfile && yarn cache clean
    `)}
    ${$if(packageType === "npm", `
      RUN npm ${ctx.existsFile("package-lock.json") ? "ci" : "install"} && npm cache clean --force
    `)}
    
    # copy project
    COPY . .
    
    # inject nodejs
    ${$inject(ctx.config.nodejs?.inject)}
    
    # set cmd
    ${$if(ctx.config.nodejs?.cmd, `
      ${$cmd(ctx.config.nodejs?.cmd)}
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
      
      ${$if(packageType === "none" && ctx.existsFile("server.js"), `
        CMD ["node", "server.js"]
      `)}
      ${$if(packageType === "none" && ctx.existsFile("app.js"), `
        CMD ["node", "app.js"]
      `)}
      ${$if(packageType === "none" && ctx.existsFile("main.js"), `
        CMD ["node", "main.js"]
      `)}
      ${$if(packageType === "none" && ctx.existsFile("index.js"), `
        CMD ["node", "index.js"]
      `)}
    `)}
  `;
  ctx.dockerfile(dockerfile);

  await ctx.build();
  await ctx.start();
};
