export const dockerfile = `
# from nginx
FROM nginx:{{ config.nginx.version | d("alpine") }}

# copy config
COPY {{ nginx_config | render_write(".depker/nginx.conf") }} /etc/nginx/nginx.conf
{% if ".depker/nginx" | exists %}
  COPY .depker/nginx /etc/nginx/conf.d/
{% endif %}

# copy project
RUN rm -f /usr/share/nginx/html/*
COPY --chown=nginx:nginx ./{{ config.nginx.root_path | d("dist") }} /usr/share/nginx/html

# healthcheck
HEALTHCHECK CMD nc -vz -w1 127.0.0.1 80

# inject
{{ config.nginx.inject.dockerfile | render }}
`;

export const nginx_config = `
user                        nginx;
worker_processes            auto;
error_log                   /var/log/nginx/error.log warn;
pid                         /var/run/nginx.pid;

events {
  worker_connections        1024;
}

include                     /etc/nginx/conf.d/*-root.conf;
{{ config.nginx.inject.root | render }}

http {
  server_tokens             off;
  include                   /etc/nginx/mime.types;
  default_type              application/octet-stream;

  log_format  main          '$remote_addr - $remote_user [$time_local] "$request" '
                            '$status $body_bytes_sent "$http_referer" '
                            '"$http_user_agent" "$http_x_forwarded_for"';
  access_log                /var/log/nginx/access.log  main;

  keepalive_timeout         65;
  sendfile                  on;
  tcp_nopush                on;
  port_in_redirect          off;

  server {
    listen                  80;
    charset                 {{ config.nginx.charset | d("utf-8") }};
    server_name             _;

    real_ip_header          x-forwarded-for;
    set_real_ip_from        0.0.0.0/0;
    real_ip_recursive       on;

    root                    /usr/share/nginx/html;
    index                   {{ config.nginx.index_pages | d(["index.html"]) | join(" ") }};

    {% for code, path in config.nginx.error_pages %}
      error_page {{ code }} /{{ path }}
    {% endfor %}

    {% if config.nginx.enable_dotfile != false %}
      location ~ /\\. {
        deny all;
        access_log      off;
        log_not_found   off;
        return 404;
      }
    {% endif %}

    {% if config.nginx.enable_cache != false %}
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
    {% endif %}
    
    {% if config.nginx.try_files != false %}
      location / {
        try_files $uri $uri/index.html $uri/ /index.html =404;
      }
    {% endif %}

    include /etc/nginx/conf.d/*-server.conf;
    {{ config.nginx.inject.server | render }}
  }

  include /etc/nginx/conf.d/*-http.conf;
  {{ config.nginx.inject.http | render }}
}
`;
