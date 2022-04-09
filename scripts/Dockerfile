FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

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

COPY --from=docker:latest /usr/local/bin/ /usr/local/bin/

RUN COMPOSE_BIN="$HOME/.docker/cli-plugins/docker-compose" && \
    COMPOSE_URL=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep "browser_download_url" | grep "docker-compose-linux-x86_64" | grep -Eo 'https://[^\"]*' | sed -n '1p') && \
    mkdir -p "$HOME/.docker/cli-plugins" && \
    wget -O "$COMPOSE_BIN" "$COMPOSE_URL" && \
    chmod +x "$COMPOSE_BIN"

RUN DEPKER_BIN="/usr/local/bin/depker" && \
    DEPKER_URL="https://github.com/syfxlin/depker/raw/master/bin/depker" && \
    wget -O "$DEPKER_BIN" "$DEPKER_URL" && \
    chmod +x "$DEPKER_BIN"

RUN /usr/local/bin/depker upgrade deno
