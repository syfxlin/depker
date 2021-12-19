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

目前 depker 还处于开发及测试阶段，暂时不提供文档

## Maintainer

depker 由 [Otstar Lin](https://ixk.me/)
和下列 [贡献者](https://github.com/syfxlin/depker/graphs/contributors)
的帮助下撰写和维护。

> Otstar Lin - [Personal Website](https://ixk.me/) · [Blog](https://blog.ixk.me/) · [Github](https://github.com/syfxlin)

## License

![License](https://img.shields.io/github/license/syfxlin/depker.svg?style=flat-square)

根据 Apache License 2.0 许可证开源。
