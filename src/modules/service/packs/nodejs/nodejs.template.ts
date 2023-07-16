import { dockerfile as dockerfile_nginx } from "../nginx/nginx.template.ts";

export const dockerfile_common = `
# from nodejs
FROM gplane/pnpm:{{ config.nodejs.version | d("alpine") }} as builder

# workdir
WORKDIR /app

# copy package.json and lock file
{% if "pnpm-lock.yaml" | exists %}
  COPY package.json pnpm-lock.yaml ./
{% elif "yarn.lock" | exists %}
  COPY package.json yarn.lock ./
{% elif "package.json" | exists %}
  COPY package*.json ./
{% endif %}

# inject before install
{{ config.nodejs.inject.before_install | render }}

# install node modules
{% if config.nodejs.install %}
  RUN {{ config.nodejs.install | command }}
{% elif "pnpm-lock.yaml" | exists %}
  RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      pnpm install --frozen-lockfile && \
      apk del .gyp
{% elif "yarn.lock" | exists %}
  RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      yarn install --frozen-lockfile && \
      apk del .gyp
{% elif "package-lock.json" | exists %}
  RUN --mount=type=cache,target=/root/.npm \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      npm ci && \
      apk del .gyp
{% elif "package.json" | exists %}
  RUN --mount=type=cache,target=/root/.npm \
      apk add --no-cache --virtual .gyp python3 make g++ && \
      npm install && \
      apk del .gyp
{% endif %}

# copy project
COPY . .

# inject after install
{{ config.nodejs.inject.after_install | render }}
`;

export const dockerfile_server = `
${dockerfile_common}

# set cmd
ENTRYPOINT []
{% if config.nodejs.command %}
  CMD {{ config.nodejs.command | command }}
{% elif "pnpm-lock.yaml" | exists %}
  CMD ["pnpm", "run", "start"]
{% elif "yarn.lock" | exists %}
  CMD ["yarn", "run", "start"]
{% elif "package.json" | exists %}
  CMD ["npm", "run", "start"]
{% elif "server.js" | exists %}
  CMD ["node", "server.js"]
{% elif "app.js" | exists %}
  CMD ["node", "app.js"]
{% elif "main.js" | exists %}
  CMD ["node", "main.js"]
{% elif "index.js" | exists %}
  CMD ["node", "index.js"]
{% endif %}
`;

export const dockerfile_static = `
${dockerfile_common}

# inject before build
{{ config.nodejs.inject.before_build | render }}

# build nodejs
{% if config.nodejs.build %}
  RUN {{ config.nodejs.build | command }}
{% elif "pnpm-lock.yaml" | exists %}
  RUN pnpm run build
{% elif "yarn.lock" | exists %}
  RUN yarn run build
{% elif "package.json" | exists %}
  RUN npm run build
{% endif %}

# inject after build
{{ config.nodejs.inject.after_build | render }}

${dockerfile_nginx.replace("--chown=nginx:nginx ./", "--chown=nginx:nginx --from=builder /app/")}
`;
