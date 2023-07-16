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
- TypeScript 支持
- Docker Pipeline 支持（待实现）

## Installation

1. [安装 Deno](https://deno.land/manual/getting_started/installation)
2. 从 [Releases](https://github.com/syfxlin/depker/releases) 下载最新的可执行文件，将其放到合理的位置，如 `/usr/local/bin`
3. 参考 [test](https://github.com/syfxlin/depker/tree/master/test) 文件夹样例编写 `depker.config.ts` 配置文件
4. 执行命令，如 `depker deploy`

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
