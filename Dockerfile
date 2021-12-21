FROM node:alpine

# prepare pnpm
RUN npm i -g pnpm

# prepare server
ENV NODE_ENV production
WORKDIR /app

# install deps
COPY ./package.json ./
COPY ./pnpm-*.yaml ./
COPY ./packages/depker-server/package.json ./packages/depker-server/
RUN pnpm install --frozen-lockfile

# copy depker-server
COPY ./packages/depker-server ./packages/depker-server

# build
RUN pnpm run -w build:server

EXPOSE 3000

CMD ["node", "./packages/depker-server/dist/src/index.js"]
