# depker

## Introduction

depker（**dep**loyment, doc**ker**） 是一个基于 Docker 的部署工具，旨在为低性能自托管服务器，降低自动化部署应用的难度，提供持续部署的能力。

## Features

- 无停机滚动更新
- 无需服务端支持
- 友好终端界面（提供彩色输出，并支持 tty 模式）
- 部署模板（通过不同的部署模板实现不同应用的部署）
- 快速访问日志（无须远程至服务器即可访问） 
- 快速执行命令（无需远程至服务器即可链接到容器内执行命令）
- Traefik 支持
- Docker Pipeline 支持（待实现）
- TypeScript 类型支持（待实现）

## Installation

```shell
npm i -g @syfxlin/depker
depker -v
depker -h
```

一些注意事项：

- 目前 depker 还处于早期测试阶段，API 随时可能会变更。
- 目前文档正在完善，请先通过 help 命令获取帮助。
- depker 在本地运行，但是还是建议在操作前对重要的数据进行备份，避免意外。

## Maintainer

depker 由 [Otstar Lin](https://ixk.me/)
和下列 [贡献者](https://github.com/syfxlin/depker/graphs/contributors)
的帮助下撰写和维护。

> Otstar Lin - [Personal Website](https://ixk.me/) · [Blog](https://blog.ixk.me/) · [Github](https://github.com/syfxlin)

## License

![License](https://img.shields.io/github/license/syfxlin/depker.svg?style=flat-square)

根据 Apache License 2.0 许可证开源。
