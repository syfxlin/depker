import { DepkerTemplate } from "../template";
import { PHPConfig } from "./types";
import { $cmd, $if, $inject, $version } from "../../utils/template";

export const name: DepkerTemplate<PHPConfig>["name"] = "php";

export const check: DepkerTemplate<PHPConfig>["check"] = async (ctx) => {
  if (ctx.existsFile("index.php")) {
    return true;
  }
  if (ctx.existsFile("server.php")) {
    return true;
  }
  if (ctx.existsFile("app.php")) {
    return true;
  }
  if (ctx.existsFile("main.php")) {
    return true;
  }
  return ctx.existsFile("composer.json");
};

export const execute: DepkerTemplate<PHPConfig>["execute"] = async (ctx) => {
  if (!(await check(ctx))) {
    throw new Error(
      "Build failed! Couldn't find php script (composer.json, server.php, app.php, main.php, index.php)!"
    );
  }
  const version = $version(ctx.config.php?.version);
  const composerVersion = $version(ctx.config.php?.composer_version);
  const extensions = (ctx.config.php?.extensions ?? []).join(" ");
  const phpd = ctx.existsFile(".depker/php.d");
  const composerJson = ctx.existsFile("composer.json");
  // prettier-ignore
  const dockerfile = `
    # from php
    FROM php:${version.right}cli-alpine
    
    # install composer and extensions
    COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
    RUN install-php-extensions @composer${composerVersion.left} ${extensions}
    
    # copy php config
    RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
    ${$if(phpd, `
      COPY .depker/php.d/ /usr/local/etc/php/conf.d/
    `)}
    
    # copy composer
    WORKDIR /app
    ${$if(composerJson, `
      COPY composer.* ./
      RUN composer install --no-dev --no-interaction --no-autoloader --no-scripts
    `)}
    
    # copy project
    COPY . .
    
    # run composer postcopy
    ${$if(composerJson, `
      RUN composer dump-autoload --optimize
    `)}
    
    # inject
    ${$inject(ctx.config.php?.inject)}
    
    # set cmd
    ${$if(ctx.config.php?.cmd, `
      ${$cmd(ctx.config.php?.cmd)}
    `, `
      ${$if(ctx.existsFile("server.php"), `
        CMD ["php", "server.php"]
      `)}
      ${$if(ctx.existsFile("app.php"), `
        CMD ["php", "app.php"]
      `)}
      ${$if(ctx.existsFile("main.php"), `
        CMD ["php", "main.php"]
      `)}
      ${$if(ctx.existsFile("index.php"), `
        CMD ["php", "index.php"]
      `)}
    `)}
  `;
  ctx.dockerfile(dockerfile);

  await ctx.build();
  await ctx.start();
};
