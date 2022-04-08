import { $choose, $if, $inject, $version } from "../../utils/template.ts";
import { nginxConf } from "./nginx.conf.ts";

export type NginxTemplateOptions = {
  version?: string;
  errors?: Record<string, string>;
  inject?: string | string[];
  // nginx.conf
  charset?: string;
  root?: string;
  index?: string;
  dotfile?: boolean;
  cache?: boolean;
  try?: boolean;
};

export const nginx = (options?: NginxTemplateOptions) => {
  options = options ?? {};
  // prettier-ignore
  return `
    # from nginx
    FROM nginx:${$version(options.version).right}alpine

    # config
    COPY ${depker.tmp.file("nginx-template", nginxConf(options))} /etc/nginx/nginx.conf
    ${$if(depker.fs.existsSync(depker.path.posix.join(".depker", "nginx")), `
      COPY .depker/nginx /etc/nginx/conf.d/
    `)}

    # copy project
    RUN rm -f /usr/share/nginx/html/*
    COPY --chown=nginx:nginx ./${$choose(options.root, "public")} /usr/share/nginx/html

    # inject
    ${$inject(options.inject)}
  `;
};
