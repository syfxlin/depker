# Depker

Depker (**dep**loyment, doc**ker**) is a deployment tool based on Docker, designed to lower the difficulty of automating application deployment for low-performance self-hosted servers, and provide continuous deployment capabilities.

## Features

- Zero-downtime rolling updates.
- No server-side support required.
- User-friendly terminal interface (providing colored output and supporting tty mode).
- Deployment templates (enabling deployment of different applications through different templates).
- Quick access to logs (accessible without the need to remote into the server).
- Quick command execution (linking to containers to execute commands without the need to remote into the server).
- Support for Traefik.
- Support for Docker Pipeline (to be implemented).
- TypeScript type support (to be implemented).

## Installation

1. [Install Deno](https://deno.land/manual/getting_started/installation)
2. Run the command `deno install -A https://raw.githubusercontent.com/syfxlin/depker/master/depker.ts --root /usr/local --name depker` to install depker.
3. Refer to the examples in the [test](https://github.com/syfxlin/depker/tree/master/test) folder to write your `depker.config.ts` configuration file
4. Run the command, such as `depker deploy`

Some important notes:

- Depker is currently in the early testing phase, and its API may change at any time.
- The documentation is currently being improved. Please use the 'help' command to get assistance for now.
- Depker runs locally, but it is still recommended to backup important data before performing any operations to avoid accidents.

## Maintainer

depker is written and maintained with the help of [Otstar Lin](https://ixk.me) and the following [contributors](https://github.com/syfxlin/depker/graphs/contributors).

> Otstar Lin - [Personal Website](https://ixk.me/) · [Blog](https://blog.ixk.me/) · [GitHub](https://github.com/syfxlin)

## License

![License](https://img.shields.io/github/license/syfxlin/depker.svg?style=flat-square)

Released under the Apache License 2.0.
