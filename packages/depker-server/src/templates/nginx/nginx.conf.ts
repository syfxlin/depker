import { $choose, $for, $if } from "../../utils/template";
import dedent from "dedent";
import { NginxConfig } from "./types";

// prettier-ignore
export const nginxConf = (config: NginxConfig) => dedent`
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
  worker_connections  1024;
}

include /etc/nginx/conf.d/*-root.conf;

http {
  server_tokens      off;
  include            /etc/nginx/mime.types;
  default_type       application/octet-stream;

  log_format  main   '$remote_addr - $remote_user [$time_local] "$request" '
                     '$status $body_bytes_sent "$http_referer" '
                     '"$http_user_agent" "$http_x_forwarded_for"';

  access_log         /var/log/nginx/access.log  main;

  keepalive_timeout  65;
  sendfile           on;
  tcp_nopush         on;
  port_in_redirect   off;

  server {
    listen 80;
    charset ${$choose(config.nginx?.charset, "utf-8")};
    server_name  _;

    real_ip_header         x-forwarded-for;
    set_real_ip_from       0.0.0.0/0;
    real_ip_recursive      on;

    root                   /app/${$choose(config.nginx?.root, "public")};
    index                  ${$choose(config.nginx?.index, 'index.html index.htm')};

    ${$for(config.nginx?.error_page, ([k, v]) => `
      error_page ${k} /${v};
    `)}

    ${$if(config.nginx?.canonical_host, `
      if ($host != ${config.nginx?.canonical_host}) {
        return 301 $scheme://${config.nginx?.canonical_host}$request_uri;
      }
    `)}
    
    ${$if(!config.nginx?.allow_dotfile, `
      location ~ /\\. {
        deny all;
        access_log      off;
        log_not_found   off;
        return 404;
      }
    `)}
    
    ${$if(!config.nginx?.disable_cache, `
      location ~* \\.(?:css|js)$ {
        access_log        off;
        log_not_found     off;
        add_header        Cache-Control "no-cache, public, must-revalidate, proxy-revalidate";
      }

      location ~* \\.(?:jpg|jpeg|gif|png|ico|xml|webp|eot|woff|woff2|ttf|svg|otf)$ {
        access_log        off;
        log_not_found     off;
        expires           60m;
        add_header        Cache-Control "public";
      }
    `)}
    
    ${$if(!config.nginx?.disable_try, `
      location / {
        try_files $uri $uri/ =404;
      }
    `)}

    include /etc/nginx/conf.d/*-server.conf;
  }

  include /etc/nginx/conf.d/*-http.conf;
}
`;
