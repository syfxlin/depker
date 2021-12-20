import DepkerTemplate from "../template";
import { PHPConfig } from "./types";
import { $cmd, $if, $inject, $version } from "../../utils/template";

export default class PHPTemplate extends DepkerTemplate<PHPConfig> {
  public get name(): string {
    return "php";
  }

  public async check() {
    if (this.ctx.existsFile("index.php")) {
      return true;
    }
    if (this.ctx.existsFile("server.php")) {
      return true;
    }
    if (this.ctx.existsFile("app.php")) {
      return true;
    }
    if (this.ctx.existsFile("main.php")) {
      return true;
    }
    return this.ctx.existsFile("composer.json");
  }

  public async execute() {
    if (!(await this.check())) {
      throw new Error(
        "Build failed! Couldn't find php script (composer.json, server.php, app.php, main.php, index.php)!"
      );
    }
    const version = $version(this.ctx.config.php?.version);
    const composerVersion = $version(this.ctx.config.php?.composer_version);
    const extensions = (this.ctx.config.php?.extensions ?? []).join(" ");
    const phpd = this.ctx.existsFile(".depker/php.d");
    const composerJson = this.ctx.existsFile("composer.json");
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
      ${$inject(this.ctx.config.php?.inject)}
      
      # set cmd
      ${$if(this.ctx.config.php?.cmd, `
        ${$cmd(this.ctx.config.php?.cmd)}
      `, `
        ${$if(this.ctx.existsFile("server.php"), `
          CMD ["php", "server.php"]
        `)}
        ${$if(this.ctx.existsFile("app.php"), `
          CMD ["php", "app.php"]
        `)}
        ${$if(this.ctx.existsFile("main.php"), `
          CMD ["php", "main.php"]
        `)}
        ${$if(this.ctx.existsFile("index.php"), `
          CMD ["php", "index.php"]
        `)}
      `)}
    `;
    this.ctx.dockerfile(dockerfile);

    const image = await this.ctx.build();
    await this.ctx.start(image);
  }
}
