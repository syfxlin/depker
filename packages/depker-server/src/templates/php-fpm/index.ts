import { DepkerTemplate } from "../template";
import { PHPFpmConfig } from "./types";
import { $if, $inject, $version } from "../../utils/template";
import fs from "fs-extra";
import { join } from "path";
import { nginxConf } from "./nginx.conf";
import { supervisorConfig } from "./supervisor";

export const name: DepkerTemplate<PHPFpmConfig>["name"] = "php-fpm";

export const check: DepkerTemplate<PHPFpmConfig>["check"] = async (ctx) => {
  if (
    fs.pathExistsSync(
      join(ctx.folder, ctx.config.nginx?.root ?? "public", "index.php")
    )
  ) {
    return true;
  }
  return ctx.existsFile("composer.json") && ctx.existsFile(".fpm");
};

export const execute: DepkerTemplate<PHPFpmConfig>["execute"] = async (ctx) => {
  // prepare php
  const version = $version(ctx.config.php?.version);
  const composerVersion = $version(ctx.config.php?.composer_version);
  const extensions = (ctx.config.php?.extensions ?? []).join(" ");
  const phpd = ctx.existsFile(".depker/php.d");
  const phpfd = ctx.existsFile(".depker/php-fpm.d");
  const composerJson = ctx.existsFile("composer.json");

  // prepare nginx
  const nginxVersion = $version(ctx.config.nginx?.version);
  const nginxd = ctx.existsFile(".depker/nginx.d");
  // if exists: use custom, no-exists: use default
  ctx.writeFile(".depker/nginx.conf", nginxConf(ctx.config), false);

  // prepare supervisor
  ctx.writeFile(".depker/supervisor.conf", supervisorConfig(), false);

  // dockerfile
  // prettier-ignore
  const dockerfile = `
    # from php
    FROM php:${version.right}fpm-alpine
    RUN apk add --no-cache shadow && usermod -u 1000 www-data && groupmod -g 1000 www-data
    
    # install nginx
    COPY --from=nginx:${nginxVersion.right}alpine /etc/nginx /etc/nginx
    COPY --from=nginx:${nginxVersion.right}alpine /usr/sbin/nginx /usr/sbin/nginx
    COPY --from=nginx:${nginxVersion.right}alpine /usr/local/bin/envsubst /usr/local/bin/envsubst
    COPY --from=nginx:${nginxVersion.right}alpine /usr/share/nginx /usr/share/nginx
    COPY --from=nginx:${nginxVersion.right}alpine /docker-entrypoint.d /docker-entrypoint.d
    COPY --from=nginx:${nginxVersion.right}alpine /docker-entrypoint.sh /docker-entrypoint.sh
    RUN apk --no-cache add tzdata curl ca-certificates \
            && runDeps="$( \
                scanelf --needed --nobanner --format '%n#p' --recursive /usr/ \
                  | tr ',' '\\n' \
                  | sort -u \
                  | awk 'system("[ -e /usr/lib/" $1 " ]") == 0 { next } { print "so:" $1 }' \
                )" \
            && apk add --no-cache $runDeps \
            && mkdir -p /var/log/nginx \
            && mkdir -p /var/cache/nginx \
            && chown www-data:www-data -R /var/log/nginx \
            && chown www-data:www-data -R /var/cache/nginx \
            && ln -sf /dev/stdout /var/log/nginx/access.log \
            && ln -sf /dev/stderr /var/log/nginx/error.log
    
    # copy php config
    RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
    ${$if(phpd, `
      COPY .depker/php.d/ /usr/local/etc/php/conf.d/
    `)}
    ${$if(phpfd, `
      COPY .depker/php-fpm.d/ /usr/local/etc/php-fpm.d/
    `)}
    
    # copy nginx config
    COPY .depker/nginx.conf /etc/nginx/nginx.conf
    ${$if(nginxd, `
      COPY .depker/nginx.d/ /etc/nginx/conf.d/
    `)}
    
    # supervisor
    RUN apk add --no-cache supervisor
    COPY .depker/supervisor.conf /etc/supervisor/supervisor.conf
    
    EXPOSE 80
    STOPSIGNAL SIGQUIT
    CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisor.conf"]
    
    # install extensions and composer
    COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
    RUN install-php-extensions @composer${composerVersion.left} ${extensions}
    
    # copy composer
    WORKDIR /app
    ${$if(composerJson, `
      COPY composer.* ./
      RUN composer install --no-dev --no-interaction --no-autoloader --no-scripts
    `)}
    
    # copy project
    COPY --chown=www-data:www-data . .
    RUN chmod 755 -R .
    
    # run composer postcopy
    ${$if(composerJson, `
      RUN composer dump-autoload --optimize
    `)}
    
    # inject
    ${$inject(ctx.config.nginx?.inject)}
    ${$inject(ctx.config.php?.inject)}
  `;
  ctx.dockerfile(dockerfile);

  await ctx.build();
  await ctx.start();
};
