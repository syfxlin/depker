import { dockerfile as dockerfile_nginx } from "../nginx/template.ts";

export const dockerfile = `
# from nodejs
FROM gplane/pnpm:{{ config.nodejs.version | d("alpine") }} AS builder

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
{{ config.nodejs.inject.after_install | render }}

# inject before build
{{ config.nodejs.inject.before_build | render }}

# build nodejs
{% if config.nodejs.build %}
  RUN {{ config.nodejs.build | command }}
{% elif self.exists("package.json") and json.parse(self.read("package.json")).scripts.build %}
  {% if self.exists("pnpm-lock.yaml") %}
    RUN pnpm run build
  {% elif self.exists("yarn.lock") %}
    RUN yarn run build
  {% elif self.exists("package.json") %}
    RUN npm run build
  {% endif %}
{% endif %}

# inject after build
{{ config.nodejs.inject.after_build | render }}
`;

export const dockerfile_server = `
${dockerfile}

# set cmd
ENTRYPOINT []
{% if config.nodejs.start %}
  CMD {{ config.nodejs.start | command }}
{% elif self.exists("package.json") and json.parse(self.read("package.json")).scripts.start %}
  {% if self.exists("pnpm-lock.yaml") %}
    CMD ["pnpm", "run", "start"]
  {% elif self.exists("yarn.lock") %}
    CMD ["yarn", "run", "start"]
  {% elif self.exists("package.json") %}
    CMD ["npm", "run", "start"]
  {% endif %}
{% elif self.exists("server.js") %}
  CMD ["node", "server.js"]
{% elif self.exists("app.js") %}
  CMD ["node", "app.js"]
{% elif self.exists("main.js") %}
  CMD ["node", "main.js"]
{% elif self.exists("index.js") %}
  CMD ["node", "index.js"]
{% endif %}
`;

export const dockerfile_static = `
${dockerfile}

${dockerfile_nginx.replace("--chown=nginx:nginx ./", "--chown=nginx:nginx --from=builder /app/")}
`;
