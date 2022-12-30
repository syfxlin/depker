import { DepkerPlugin } from "../../plugin.types";
import { nginxConf } from "./nginx.conf";
import { $if } from "../../../utils/template";

export const nginx: DepkerPlugin = {
  name: "nginx",
  label: "Nginx",
  group: "General",
  icon: "nginx",
  buildpack: {
    options: [
      {
        type: "string",
        name: "version",
        label: "Version",
        description: "Nginx version information. If not set, default is alpine",
        placeholder: "1.23-alpine",
      },
      {
        type: "string",
        name: "charset",
        label: "Charset",
        description: "...",
        placeholder: "utf-8",
      },
      {
        type: "string",
        name: "root_path",
        label: "Root Path",
        description: "...",
        placeholder: "dist",
      },
      {
        type: "list",
        name: "index_pages",
        label: "Index Pages",
        description: "...",
        placeholder: "index.html",
      },
      {
        type: "object",
        name: "error_pages",
        label: "Error Pages",
        description: "Error page definition. key: status code, value: page path.",
        placeholder: "500, error/500.html",
      },
      {
        type: "boolean",
        name: "try_files",
        label: "Try Files",
        description: "...",
        placeholder: "Yes",
      },
      {
        type: "boolean",
        name: "enable_dotfile",
        label: "Enable Dotfile Access",
        description: "...",
        placeholder: "Yes",
      },
      {
        type: "boolean",
        name: "enable_cache",
        label: "Enable Resource Cache",
        description: "...",
        placeholder: "Yes",
      },
      {
        type: "text",
        name: "inject_root",
        label: "Inject Root Config",
        description: "...",
        placeholder: "pid /var/run/nginx.pid;",
      },
      {
        type: "text",
        name: "inject_http",
        label: "Inject Http Config",
        description: "...",
        placeholder: "tcp_nopush on;",
      },
      {
        type: "text",
        name: "inject_server",
        label: "Inject Server Config",
        description: "...",
        placeholder: "real_ip_recursive on;",
      },
      {
        type: "text",
        name: "inject_dockerfile",
        label: "Inject Dockerfile",
        description: "...",
        placeholder: "RUN echo 123;",
      },
    ],
    handler: async (ctx) => {
      const options = await ctx.extensions();

      // prettier-ignore
      const dockerfile = `
        # from nginx
        FROM nginx:${options.version ?? "alpine"}
        
        # config
        COPY ${ctx.temp("nginx.conf", nginxConf(options))} /etc/nginx/nginx.conf
        ${$if(ctx.exists(".depker/nginx"), `
          COPY .depker/nginx /etc/nginx/conf.d/
        `)}
        
        # copy
        RUN rm -f /usr/share/nginx/html/*
        COPY --chown=nginx:nginx ./${options.root_path ?? "dist"} /usr/share/nginx/html
        
        # inject
        ${options.inject_dockerfile ?? ""}
      `;

      ctx.dockerfile(dockerfile);
      await ctx.deployment();
    },
  },
};
