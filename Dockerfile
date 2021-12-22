FROM node:lts-alpine

RUN apk add --no-cache python3-dev libc-dev make g++ openssl-dev libffi-dev gcc musl-dev
RUN npm i -g @syfxlin/depker-server

WORKDIR /app

ENV NODE_ENV production

EXPOSE 3000

VOLUME ["/root/.config/depker"]

CMD ["depker-server"]
