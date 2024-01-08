export const dockerfile = `
# syntax=docker/dockerfile:1
# from nodejs
FROM gplane/pnpm:{{ config.coline.version | d("alpine") }} AS builder

# workdir
WORKDIR /app

# set max old space size
ENV NODE_OPTIONS="--max_old_space_size={{ config.coline.memory | d("4096") }}"

# clone project
ADD https://github.com/syfxlin/blog.git#master /app

# inject before install
{{ config.coline.inject.before_install | render }}

# install node modules
{% if config.coline.install %}
  RUN {{ config.coline.install | command }}
{% else %}
  RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      pnpm install --frozen-lockfile && \
      apk del .gyp
{% endif %}

# copy project
RUN rm -rf /app/public
COPY . .

# inject after install
{{ config.coline.inject.after_install | render }}

# inject before build
{{ config.coline.inject.before_build | render }}

# build nodejs
{% if config.coline.build %}
  RUN {{ config.coline.build | command }}
{% else %}
  RUN --mount=type=cache,target=/app/.next/cache --mount=type=secret,id==depker-envs,dst=/app/.env pnpm run build
{% endif %}

# inject after build
{{ config.coline.inject.after_build | render }}

# from nodejs
FROM gplane/pnpm:{{ config.coline.version | d("alpine") }}

# workdir
WORKDIR /app

# copy project
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

# inject
{{ config.coline.inject.dockerfile | render }}

# start coline
EXPOSE 80
ENV PORT=80
ENV HOSTNAME=0.0.0.0
HEALTHCHECK CMD nc -vz -w1 127.0.0.1 80
CMD ["node", "server.js"]
`;
