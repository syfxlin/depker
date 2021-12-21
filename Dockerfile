FROM node:lts-alpine

# prepare pnpm
RUN npm i -g pnpm
RUN apk add --no-cache python3-dev libc-dev make g++ openssl-dev libffi-dev gcc musl-dev

# prepare server
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

# set production
ENV NODE_ENV production

EXPOSE 3000

CMD ["node", "./packages/depker-server/dist/src/index.js"]
