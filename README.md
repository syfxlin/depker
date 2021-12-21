# depker

## Introduction

depker（**dep**loyment, doc**ker**） 是一个基于 Docker 的部署工具，旨在为低性能自托管服务器，降低自动化部署应用的难度，提供持续部署的能力。

## Features

- 一键部署（depker 自动选用所需镜像）
- 无停机滚动更新（若设置了端口则需要停机）
- 命令行支持
- 令牌认证（用于 CI 部署）
- 部署秘密（可用于 Labels 或 Env，用于隐藏敏感信息）
- 从 tar 存档文件部署
- 从 Git 部署
- 应用控制（列表、删除、重启、停止等）
- 交互式初始化配置文件
- 中央存储管理（用于提供一键备份支持）
- 部署模板（通过不同的部署模板实现不同应用的部署）
- 快速访问日志（无须远程至服务器即可访问）
- 快速执行命令（无需远程至服务器即可链接到容器内执行命令）
- Traefik 功能

## Installation

```shell
# 目前 depker 还未正式发布，可以使用以下方式抢先体验
git clone https://github.com/syfxlin/depker
docker-compose up -d
# 客户端（cli）
node packages/depker-cli/bin/depker.js --help
```

一些注意事项：

- 目前 depker 还处于早期测试阶段，请注意备份，避免数据丢失。
- 在 inside docker 环境下可能会存在 traefik 镜像不存在的情况，请在宿主机手动拉取即可修复：`docker pull traefik:latest`。
- 在设置 endpoint 的时候，请注意删除后缀 '/'，否则会导致 socket.io 连接失败，如 `https://xxx.com/` 是错误的，`https://xxx.com` 是正确的。

## Maintainer

depker 由 [Otstar Lin](https://ixk.me/)
和下列 [贡献者](https://github.com/syfxlin/depker/graphs/contributors)
的帮助下撰写和维护。

> Otstar Lin - [Personal Website](https://ixk.me/) · [Blog](https://blog.ixk.me/) · [Github](https://github.com/syfxlin)

## License

![License](https://img.shields.io/github/license/syfxlin/depker.svg?style=flat-square)

根据 Apache License 2.0 许可证开源。
