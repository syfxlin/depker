# depker

## Introduction

depker（**dep**loyment, doc**ker**） 是一个基于 Docker 的部署工具，旨在为低性能自托管服务器，降低自动化部署应用的难度，提供持续部署的能力。

与 v1 不同，v2 提供了多任务的能力以及导入任何 Deno 依赖的能力，通过 depker 亦可以实现类似脚本和 CI 的能力。

## Features

- 定义多任务（导出的函数视为任务）
- TypeScript 编写任务脚本
- 导入任何 Deno 依赖（基于 Deno 开发，可以通过 import 导入任何 Deno 库）
- 友好终端界面（提供彩色输出，并支持 tty 模式）
- 无需服务端支持
- 扩展支持（扩展即一个 Deno 脚本文件，可以通过 import 导入）
- TypeScript 类型支持（良好的 IDE 提示）
- 内置 Docker 以及 Docker Compose 支持
- 内置常见的 Dockerfile 模板
- Traefik 功能
- Docker Pipeline 支持（待实现）

## Installation

```shell
wget https://github.com/syfxlin/depker/raw/master/bin/depker
sudo mv depker /usr/local/bin/depker
sudo chmod +x /usr/local/bin/depker
```

一些注意事项：

- 目前 depker 还处于早期测试阶段，API 随时可能会变更。
- depker 在本地运行，但是还是建议在操作前对重要的数据进行备份，避免意外。

## Maintainer

depker 由 [Otstar Lin](https://ixk.me/)
和下列 [贡献者](https://github.com/syfxlin/depker/graphs/contributors)
的帮助下撰写和维护。

> Otstar Lin - [Personal Website](https://ixk.me/) · [Blog](https://blog.ixk.me/) · [Github](https://github.com/syfxlin)

## License

![License](https://img.shields.io/github/license/syfxlin/depker.svg?style=flat-square)

根据 Apache License 2.0 许可证开源。
