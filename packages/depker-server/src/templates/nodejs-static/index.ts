import { DepkerTemplate } from "../template";
import { NodejsStaticConfig } from "./types";
import { $choose, $if, $inject, $version } from "../../utils/template";
import { nginxConf } from "../nginx/nginx.conf";

export const name: DepkerTemplate<NodejsStaticConfig>["name"] = "nodejs-static";

export const check: DepkerTemplate<NodejsStaticConfig>["check"] = async (
  ctx
) => {
  return ctx.existsFile("package.json") && ctx.existsFile(".static");
};

export const execute: DepkerTemplate<NodejsStaticConfig>["execute"] = async (
  ctx
) => {
  // 如果不存在 package.json 就没必要用 node-static 环境了，请直接使用 nginx 环境，或者 nodejs 环境
  if (!ctx.existsFile("package.json")) {
    throw new Error("Build failed! Couldn't find package.json!");
  }
  // prepare nodejs
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

  // prepare nginx
  const nginxVersion = $version(ctx.config.nginx?.version);
  const root = $choose(ctx.config.nginx?.root, "public");
  const nginxd = ctx.existsFile(".depker/nginx.d");
  // if exists: use custom, no-exists: use default
  ctx.writeFile(".depker/nginx.conf", nginxConf(ctx.config), false);

  // dockerfile
  // prettier-ignore
  const dockerfile = `
    # from nodejs
    FROM node:${version.right}alpine as builder
    
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
      RUN pnpm install --prod --frozen-lockfile
    `)}
    ${$if(packageType === "yarn", `
      RUN yarn install --production --frozen-lockfile && yarn cache clean
    `)}
    ${$if(packageType === "npm", `
      RUN npm ${ctx.existsFile("package-lock.json") ? "ci" : "install"} --only=production && npm cache clean --force
    `)}

    # copy project
    COPY . .
    
    # inject prebuild
    ${$inject(ctx.config.nodejs?.inject_prebuild)}
    
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
    ${$inject(ctx.config.nodejs?.inject)}

    # from nginx
    FROM nginx:${nginxVersion.right}alpine

    # config
    COPY --from=builder /app/.depker/nginx.conf /etc/nginx/nginx.conf
    ${$if(nginxd, `
      COPY --from=builder /app/.depker/nginx.d/ /etc/nginx/conf.d/
    `)}
    
    # copy project
    WORKDIR /app
    COPY --chown=nginx:nginx --from=builder /app/${root} ./${root}
    
    # inject
    ${$inject(ctx.config.nginx?.inject)}
  `;
  ctx.dockerfile(dockerfile);

  // build & start
  await ctx.build();
  await ctx.start();
};
