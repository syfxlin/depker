import { NginxTemplateOptions } from "../nginx/index.ts";
import { $choose, $cmd, $if, $inject, $version } from "../../utils/template.ts";
import { nginxConf } from "../nginx/nginx.conf.ts";

export type NodeJSTemplateOptions = {
  version?: string;
  inject_prepare?: string | string[];
  inject?: string | string[];
  cmd?: string | string[];
};

export type NodeJSStaticTemplateOptions = {
  version?: string;
  inject_prepare?: string | string[];
  inject_prebuild?: string;
  inject?: string | string[];
  nginx?: NginxTemplateOptions;
};

export const nodejs = (options?: NodeJSTemplateOptions) => {
  options = options ?? {};

  let type = depker.fs.existsSync("package.json") ? "npm" : "none";
  if (depker.fs.existsSync("pnpm-lock.yaml")) {
    type = "pnpm";
  }
  if (depker.fs.existsSync("yarn.lock")) {
    type = "yarn";
  }

  // prettier-ignore
  return `
    # from nodejs
    FROM gplane/pnpm:${$version(options.version).right}alpine as builder
    WORKDIR /app

    # copy package.json and lock file
    ${$if(type === "pnpm", `
      COPY package.json pnpm-lock.yaml ./
    `)}
    ${$if(type === "yarn", `
      COPY package.json yarn.lock ./
    `)}
    ${$if(type === "npm", `
      COPY package*.json ./
    `)}

    # inject prepare
    ${$inject(options.inject_prepare)}
    
    # install node modules
    ${$if(type === "pnpm", `
      RUN pnpm install --prod --frozen-lockfile
    `)}
    ${$if(type === "yarn", `
      RUN yarn install --production --frozen-lockfile && yarn cache clean
    `)}
    ${$if(type === "npm", `
      RUN npm ${depker.fs.existsSync("package-lock.json") ? "ci" : "install"} --only=production && npm cache clean --force
    `)}

    # copy project
    COPY . .

    # inject nodejs
    ${$inject(options.inject)}

    # set cmd
    ${$if(options.cmd, $cmd(options.cmd), $if(type !== "none", `
      CMD ["${type}", "run", "start"]
    `, `
      ${$if(depker.fs.existsSync("server.js"), `
        CMD ["node", "server.js"]
      `)}
      ${$if(depker.fs.existsSync("app.js"), `
        CMD ["node", "app.js"]
      `)}
      ${$if(depker.fs.existsSync("main.js"), `
        CMD ["node", "main.js"]
      `)}
      ${$if(depker.fs.existsSync("index.js"), `
        CMD ["node", "index.js"]
      `)}
    `))}
  `;
};

export const nodejs_static = (options?: NodeJSStaticTemplateOptions) => {
  options = options ?? {};
  options.nginx = options.nginx ?? {};

  let type = depker.fs.existsSync("package.json") ? "npm" : "none";
  if (depker.fs.existsSync("pnpm-lock.yaml")) {
    type = "pnpm";
  }
  if (depker.fs.existsSync("yarn.lock")) {
    type = "yarn";
  }

  // prettier-ignore
  return `
    # from nodejs
    FROM gplane/pnpm:${$version(options.version).right}alpine as builder
    WORKDIR /app

    # copy package.json and lock file
    ${$if(type === "pnpm", `
      COPY package.json pnpm-lock.yaml ./
    `)}
    ${$if(type === "yarn", `
      COPY package.json yarn.lock ./
    `)}
    ${$if(type === "npm", `
      COPY package*.json ./
    `)}

    # inject prepare
    ${$inject(options.inject_prepare)}
    
    # install node modules
    ${$if(type === "pnpm", `
      RUN pnpm install --frozen-lockfile
    `)}
    ${$if(type === "yarn", `
      RUN yarn install --frozen-lockfile && yarn cache clean
    `)}
    ${$if(type === "npm", `
      RUN npm ${depker.fs.existsSync("package-lock.json") ? "ci" : "install"} && npm cache clean --force
    `)}

    # copy project
    COPY . .

    # inject prebuild
    ${$inject(options.inject_prebuild)}

    # build nodejs
    ${$if(type !== "none", `
      RUN ${type} run build
    `)}

    # inject
    ${$inject(options.inject)}

    # from nginx
    FROM nginx:${$version(options.nginx.version).right}alpine

    # config
    COPY ${depker.tmp.file("nginx-template", nginxConf(options.nginx))} /etc/nginx/nginx.conf
    ${$if(depker.fs.existsSync(depker.path.posix.join(".depker", "nginx")), `
      COPY .depker/nginx /etc/nginx/conf.d/
    `)}

    # copy project
    RUN rm -f /usr/share/nginx/html/*
    COPY --chown=nginx:nginx --from=builder /app/${$choose(options.nginx.root, "public")} /usr/share/nginx/html

    # inject
    ${$inject(options.nginx.inject)}
  `;
};
