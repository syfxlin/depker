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

RUN COMPOSE_URL=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep "browser_download_url" | grep "docker-compose-linux-x86_64" | grep -Eo 'https://[^\"]*' | sed -n '1p') && \
    DOCKER_PLUGINS="/usr/libexec/docker/cli-plugins" && \
    mkdir -p "$DOCKER_PLUGINS" && \
    wget -O "$DOCKER_PLUGINS/docker-compose" "$COMPOSE_URL" && \
    chmod +x "$DOCKER_PLUGINS/docker-compose"

COPY ./depker /usr/local/bin/depker
RUN chmod +x /usr/local/bin/depker
