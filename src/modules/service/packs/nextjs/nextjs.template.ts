export const dockerfile = `
# from nodejs
FROM gplane/pnpm:{{ config.nextjs.version | d("alpine") }} as builder

# workdir
WORKDIR /app

# set max old space size
ENV NODE_OPTIONS="--max_old_space_size={{ config.nextjs.memory | d("4096") }}"

# copy package.json and lock file
{% if self.exists("pnpm-lock.yaml") %}
  COPY package.json pnpm-lock.yaml ./
{% elif self.exists("yarn.lock") %}
  COPY package.json yarn.lock ./
{% elif self.exists("package.json") %}
  COPY package*.json ./
{% endif %}

# inject before install
{{ config.nextjs.inject.before_install | render }}

# install node modules
{% if config.nodejs.install %}
  RUN {{ config.nodejs.install | command }}
{% elif self.exists("pnpm-lock.yaml") %}
  RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      pnpm install --frozen-lockfile && \
      apk del .gyp
{% elif self.exists("yarn.lock") %}
  RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      yarn install --frozen-lockfile && \
      apk del .gyp
{% elif self.exists("package-lock.json") %}
  RUN --mount=type=cache,target=/root/.npm \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      npm ci && \
      apk del .gyp
{% elif self.exists("package.json") %}
  RUN --mount=type=cache,target=/root/.npm \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      npm install && \
      apk del .gyp
{% endif %}

# copy project
COPY . .

# inject after install
{{ config.nextjs.inject.after_install | render }}

# inject before build
{{ config.nextjs.inject.before_build | render }}

# build nodejs
{% if config.nextjs.build %}
  RUN {{ config.nextjs.build | command }}
{% elif self.exists("pnpm-lock.yaml") %}
  RUN --mount=type=cache,target=/app/.next/cache --mount=type=secret,id=secrets,dst=/app/.env pnpm run build
{% elif self.exists("yarn.lock") %}
  RUN --mount=type=cache,target=/app/.next/cache --mount=type=secret,id=secrets,dst=/app/.env yarn run build
{% elif self.exists("package.json") %}
  RUN --mount=type=cache,target=/app/.next/cache --mount=type=secret,id=secrets,dst=/app/.env npm run build
{% endif %}

RUN ls

# inject after build
{{ config.nextjs.inject.after_build | render }}

# from nodejs
FROM gplane/pnpm:{{ config.nextjs.version | d("alpine") }}

# workdir
WORKDIR /app

# copy project
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

# inject
{{ config.nextjs.inject.dockerfile | render }}

# start nextjs
EXPOSE 80
ENV PORT=80
ENV HOSTNAME=0.0.0.0
HEALTHCHECK CMD nc -vz -w1 127.0.0.1 80
CMD ["node", "server.js"]
`;
