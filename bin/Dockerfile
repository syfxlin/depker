# step: build
FROM golang:latest as builder

WORKDIR /app

COPY . .

RUN go build -o depker depker.go

# step: depker
FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

COPY --from=docker:latest /usr/local/bin/docker /usr/local/bin/docker
COPY --from=denoland/deno:latest /usr/bin/deno /usr/local/bin/deno

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        curl \
        wget \
        iptables && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apk/*

COPY --from=builder /app/depker /usr/local/bin/depker
RUN chmod +x /usr/local/bin/depker
