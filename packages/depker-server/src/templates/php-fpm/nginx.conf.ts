import { $choose, $for, $if } from "../../utils/template";
import { PHPFpmConfig } from "./types";

// prettier-ignore
export const nginxConf = (config: PHPFpmConfig) => `
user  www-data;
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
  
  # set $https only when SSL is actually used.
  map $http_x_forwarded_proto $proxy_https {
      https   on;
  }
  # setup the scheme to use on redirects
  map $http_x_forwarded_proto $proxy_scheme {
      default http;
      http    http;
      https   https;
  }

  server {
    listen 80;
    charset ${$choose(config.nginx?.charset, "utf-8")};
    server_name  _;

    real_ip_header         x-forwarded-for;
    set_real_ip_from       0.0.0.0/0;
    real_ip_recursive      on;

    root                   /app/${$choose(config.nginx?.root, "public")};
    index                  ${$choose(config.nginx?.index, 'index.php index.html index.htm')};

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
    
    location ~* \\.php$ {
      root /app/${$choose(config.nginx?.root, "public")};
      try_files               $uri =404;

      fastcgi_param  SCRIPT_FILENAME    $document_root$fastcgi_script_name;
      fastcgi_param  QUERY_STRING       $query_string;
      fastcgi_param  REQUEST_METHOD     $request_method;
      fastcgi_param  CONTENT_TYPE       $content_type;
      fastcgi_param  CONTENT_LENGTH     $content_length;

      fastcgi_param  SCRIPT_NAME        $fastcgi_script_name;
      fastcgi_param  REQUEST_URI        $request_uri;
      fastcgi_param  DOCUMENT_URI       $document_uri;
      fastcgi_param  DOCUMENT_ROOT      $document_root;
      fastcgi_param  SERVER_PROTOCOL    $server_protocol;
      fastcgi_param  REQUEST_SCHEME     $proxy_scheme;
      fastcgi_param  HTTPS              $proxy_https if_not_empty;

      fastcgi_param  GATEWAY_INTERFACE  CGI/1.1;
      fastcgi_param  SERVER_SOFTWARE    nginx/$nginx_version;

      fastcgi_param  REMOTE_ADDR        $remote_addr;
      fastcgi_param  REMOTE_PORT        $remote_port;
      fastcgi_param  SERVER_ADDR        $server_addr;
      fastcgi_param  SERVER_PORT        $server_port;
      fastcgi_param  SERVER_NAME        $host;
      fastcgi_param  HTTP_PROXY "";
      fastcgi_param  REDIRECT_STATUS    200;

      fastcgi_split_path_info ^(.+\\.php)(/.+)$;
      fastcgi_index           index.php;
      fastcgi_pass            127.0.0.1:9000;
      fastcgi_keep_conn       off;
    }

    include /etc/nginx/conf.d/*-server.conf;
  }

  include /etc/nginx/conf.d/*-http.conf;
}
`;
