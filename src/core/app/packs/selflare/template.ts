export const dockerfile = `
# from nodejs
FROM gplane/pnpm:{{ config.nodejs.version | d("latest") }} AS builder

# install selflare
RUN --mount=type=cache,target=/root/.npm npm i -g selflare

# workdir
WORKDIR /app

# copy package.json and lock file
{% if self.exists("pnpm-lock.yaml") %}
  COPY package.json pnpm-lock.yaml ./
{% elif self.exists("yarn.lock") %}
  COPY package.json yarn.lock ./
{% elif self.exists("package.json") %}
  COPY package*.json ./
{% endif %}

# inject before install
{{ config.nodejs.inject.before_install | render }}

# install node modules
{% if config.nodejs.install %}
  RUN {{ config.nodejs.install | command }}
{% elif self.exists("pnpm-lock.yaml") %}
  RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
      apt-get update && apt-get install python3 make g++ && \
      pnpm install --frozen-lockfile
{% elif self.exists("yarn.lock") %}
  RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
      apt-get update && apt-get install python3 make g++ && \
      yarn install --frozen-lockfile
{% elif self.exists("package-lock.json") %}
  RUN --mount=type=cache,target=/root/.npm \
      apt-get update && apt-get install python3 make g++ && \
      npm ci
{% elif self.exists("package.json") %}
  RUN --mount=type=cache,target=/root/.npm \
      apt-get update && apt-get install python3 make g++ && \
      npm install
{% endif %}

# copy project
COPY . .

# inject after install
{{ config.nodejs.inject.after_install | render }}

# inject before build
{{ config.nodejs.inject.before_build | render }}

# build nodejs
{% if config.nodejs.build %}
  RUN {{ config.nodejs.build | command }}
{% else %}
  RUN node /usr/local/bin/selflare compile
{% endif %}

# inject after build
{{ config.nodejs.inject.after_build | render }}

# from selflare
FROM jacoblincool/workerd:latest
WORKDIR /worker
COPY --from=builder /app/worker.capnp ./worker.capnp
RUN mkdir -p ./cache ./kv ./d1 ./r2
VOLUME /worker
EXPOSE 8080
CMD ["serve", "--experimental", "--binary", "worker.capnp"]
`;
