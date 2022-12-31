import { LoadedDepkerPlugin } from "../../plugin.types";
import path from "path";
import { fileURLToPath } from "url";
import { dockerfile, nginx_config } from "./nginx.template";

export const nginx: LoadedDepkerPlugin = {
  pkg: "nginx",
  dir: path.dirname(fileURLToPath(import.meta.url)),
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
        description: "Nginx version information. Default: alpine",
        placeholder: "1.23-alpine",
      },
      {
        type: "string",
        name: "charset",
        label: "Charset",
        description: "Adds the specified charset to the “Content-Type” response header field. Default: utf-8",
        placeholder: "utf-8",
      },
      {
        type: "string",
        name: "root_path",
        label: "Root Path",
        description: "The location of the static files in the project folder. Default: dist",
        placeholder: "dist",
      },
      {
        type: "list",
        name: "index_pages",
        label: "Index Pages",
        description: "Defines files that will be used as an index.",
        placeholder: "index.html",
      },
      {
        type: "object",
        name: "error_pages",
        label: "Error Pages",
        description: "Defines the URI that will be shown for the specified errors. key: status code, value: page path.",
        placeholder: "500, error/500.html",
      },
      {
        type: "boolean",
        name: "try_files",
        label: "Try Files",
        description: "Checks the existence of files in the specified order and uses. Default: Yes",
        placeholder: "Yes",
      },
      {
        type: "boolean",
        name: "enable_dotfile",
        label: "Enable Dotfile Access",
        description: "Whether to enable access to dotfile. Default: Yes",
        placeholder: "Yes",
      },
      {
        type: "boolean",
        name: "enable_cache",
        label: "Enable Resource Cache",
        description: "Whether to enable static file caching. Default: Yes",
        placeholder: "Yes",
      },
      {
        type: "text",
        name: "inject_root",
        label: "Inject Root Config",
        description: "Injecting the configuration of the Nginx Root scope.",
        placeholder: "pid /var/run/nginx.pid;",
      },
      {
        type: "text",
        name: "inject_http",
        label: "Inject Http Config",
        description: "Injecting the configuration of the Nginx Http scope.",
        placeholder: "tcp_nopush on;",
      },
      {
        type: "text",
        name: "inject_server",
        label: "Inject Server Config",
        description: "Injecting the configuration of the Nginx Server scope.",
        placeholder: "real_ip_recursive on;",
      },
      {
        type: "text",
        name: "inject_dockerfile",
        label: "Inject Dockerfile",
        description: "Inject the Dockerfile command to the end.",
        placeholder: "RUN echo 123;",
      },
    ],
    handler: async (ctx) => {
      const options = await ctx.extensions();
      const template = ctx.render(dockerfile, { nginx_config, ...options });
      ctx.dockerfile(template);
      await ctx.deployment();
    },
  },
};
