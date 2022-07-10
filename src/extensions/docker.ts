import {exec as $exec, logger, tmp} from "./libs.ts";

export type DockerBuildOptions = {
  dockerfile?: string;
  dockerfile_contents?: string;
  pull?: boolean;
  push?: boolean;
  // values
  extra_tag?: string[];
  build_arg?: Record<string, string>; // arg_name, arg_value
  label?: Record<string, string>; // label_name, label_value
  secret?: Record<string, string>; // secret_id, secret_src
  // ext
  ssh?: Record<string, string>; // ssh_id, ssh_socket or ssh_key
  // extra args
  add_host?: Record<string, string>;
  compress?: boolean;
  cache?: boolean | string[];
  // flags
  flags?: string[];
};

export type DockerRunOptions = {
  command?: string[];
  entrypoint?: string[];
  init?: boolean;
  rm?: boolean;
  pull?: "always" | "missing" | "never";
  restart?: "no" | "always" | "on-failure" | `on-failure:${number}`;
  // values
  env?: Record<string, string>;
  env_file?: string[];
  label?: Record<string, string>;
  label_file?: string[];
  publish?: string[] | "all";
  expose?: string[];
  volume?: string[];
  network?: string; // default: docker
  // traefik
  traefik?: {
    // if set rule, disable domain
    domain?: string | string[];
    rule?: string;
    // if set service, disable port and schema
    port?: number;
    schema?: string;
    service?: string;
    // tls
    tls?: boolean | string;
    // middleware
    middlewares?: {
      name: string;
      type: string;
      options: Record<string, string>;
    }[];
  };
  // extension
  add_host?: Record<string, string>;
  attach?: "stdin" | "stdout" | "stderr";
  cap_add?: string[];
  cap_drop?: string[];
  detach?: boolean; // default: true
  health?:
    | {
        cmd: string;
        retries: number;
        interval: string;
        start_period?: string;
        timeout?: string;
      }
    | false;
  hostname?: string;
  interactive?: boolean;
  privileged?: boolean;
  user?: string;
  workdir?: string;
  // rolling deployment
  rolling?: number;
  // flags
  flags?: string[];
};

export type DockerOfOptions = {
  name: string;
  image: string;
  run?: DockerRunOptions;
  build?: DockerBuildOptions;
};

export type DockerOfArgs = () => DockerOfOptions | Promise<DockerOfOptions>;

export const context = async (context: string) => {
  const cmd = ["docker", "context", "use", context];

  logger.info(`Switch docker context: ${context}`);
  await $exec({ cmd, type: "inherit" });
};

export const login = async (server: string, username: string, password: string) => {
  const cmd = [
    "docker",
    "login",
    `--username=${username}`,
    `--password=${password}`,
    server,
  ];

  logger.info(`Login docker registry: ${server}`);
  await $exec({ cmd, type: "inherit" });
};

export const build = async (image: string, options?: DockerBuildOptions) => {
  const {
    dockerfile,
    dockerfile_contents,
    pull,
    push: $push,
    extra_tag,
    build_arg,
    label,
    secret,
    ssh,
    add_host,
    compress,
    cache,
    flags,
  } = options ?? {};

  if (dockerfile && dockerfile_contents) {
    throw new Error("Cannot specify both dockerfile and dockerfile_contents keyword arguments");
  }

  const [img, tag = `depker-${Date.now()}`] = image.split(":");
  const cmd = [`docker`, `build`, `--tag=${img}:${tag}`];

  // config
  if (pull) {
    cmd.push(`--pull`);
  }
  if (extra_tag) {
    extra_tag.forEach((tag) => {
      cmd.push(`--tag=${img}:${tag}`);
    });
  }
  if (build_arg) {
    Object.entries(build_arg).forEach(([key, value]) => {
      cmd.push(`--build-arg=${key}=${value}`);
    });
  }
  if (label) {
    Object.entries(label).forEach(([key, value]) => {
      cmd.push(`--label=${key}=${value}`);
    });
  }
  if (secret) {
    Object.entries(secret).forEach(([id, src]) => {
      cmd.push(`--secret=id=${id},src=${src}`);
    });
  }
  if (ssh) {
    Object.entries(ssh).forEach(([id, value]) => {
      cmd.push(`--ssh=${id}=${value}`);
    });
  }
  if (add_host) {
    Object.entries(add_host).forEach(([host, ip]) => {
      cmd.push(`--add-host=${host}:${ip}`);
    });
  }
  if (cache === false) {
    cmd.push(`--no-cache`);
  }
  if (typeof cache !== "boolean" && cache) {
    cache.forEach((c) => {
      cmd.push(`--cache-from=${c}`);
    });
  }
  if (compress) {
    cmd.push(`--compress`);
  }

  // dockerfile
  if (dockerfile) {
    cmd.push(`--file=${dockerfile}`);
  } else if (dockerfile_contents) {
    cmd.push(`--file=${tmp.file("depker-dockerfile", dockerfile_contents)}`);
  } else {
    cmd.push(`--file=./Dockerfile`);
  }
  // context
  cmd.push(`.`);

  // flags
  if (flags) {
    cmd.push(...flags);
  }

  // build
  logger.step(`Building docker image: ${img}:${tag}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully build image`);

  // push
  if ($push) {
    await push(`${img}:${tag}`);
  } else {
    logger.info(`Skip push image`);
  }

  return `${img}:${tag}`;
};

export const push = async (image: string) => {
  const cmd = ["docker", "push", image];

  logger.step(`Pushing docker image: ${image}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully push image`);
};

export const pull = async (image: string) => {
  const cmd = ["docker", "pull", image];

  logger.step(`Pulling docker image: ${image}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully pull image`);
};

export const start = async (container: string | string[]) => {
  const containers = [container].flat();
  const cmd = ["docker", "start", ...containers];

  logger.step(`Start container: ${containers.join(", ")}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully start container`);
};

export const stop = async (container: string | string[]) => {
  const containers = [container].flat();
  const cmd = ["docker", "stop", ...containers];

  logger.step(`Stop container: ${containers.join(", ")}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully stop container`);
};

export const restart = async (container: string | string[]) => {
  const containers = [container].flat();
  const cmd = ["docker", "restart", ...containers];

  logger.step(`Restart container: ${containers.join(", ")}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully restart container`);
};

export const status = async (name: string): Promise<string> => {
  const cmd = ["docker", "ps", "--all", "--format={{ .Names }}:{{ .Status }}"];

  logger.step(`Get container status: ${name}`);
  const logs = await $exec({ cmd }).combined;
  const status = logs.map((i) => i.trim().split(":")).find((i) => i[0] === name)?.[1];
  return status ?? "Not found";
};

export const state = async (name: string): Promise<"created" | "running" | "exited" | "no"> => {
  const cmd = ["docker", "ps", "--all", "--format={{ .Names }}:{{ .State }}"];

  logger.step(`Get container status: ${name}`);
  const logs = await $exec({ cmd }).combined;
  const status = logs.map((i) => i.trim().split(":")).find((i) => i[0] === name)?.[1] as any;
  return status ?? "Not found";
};

export const remove = async (container: string | string[], force?: boolean) => {
  const containers = [container].flat().filter((s) => s);
  const cmd = ["docker", "rm", force && "--force", ...containers]

  logger.step(`Remove container: ${containers.join(", ")}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully remove container`);
};

export const run = async (name: string, image: string, options?: DockerRunOptions) => {
  const {
    command,
    entrypoint,
    init,
    rm,
    pull,
    restart,
    // values
    env,
    env_file,
    label,
    label_file,
    publish,
    expose,
    volume,
    network,
    // traefik
    traefik,
    // extension
    add_host,
    attach,
    cap_add,
    cap_drop,
    detach,
    health,
    hostname,
    interactive,
    privileged,
    user,
    workdir,
    // rolling deployment
    rolling,
    // flags
    flags,
  } = options ?? {};

  const cmd = [`docker`, `run`, `--name=${name}`];

  if (entrypoint) {
    cmd.push(`--entrypoint="${entrypoint.join(" ")}"`);
  }
  if (init) {
    cmd.push(`--init`);
  }
  if (rm) {
    cmd.push(`--rm`);
  }
  if (pull) {
    cmd.push(`--pull=${pull}`);
  }
  if (restart === undefined || restart) {
    cmd.push(`--restart=${restart ?? "always"}`);
  }

  // values
  if (env) {
    Object.entries(env).forEach(([key, value]) => {
      cmd.push(`--env=${key}=${value}`);
    });
  }
  if (env_file) {
    env_file.forEach((value) => {
      cmd.push(`--env-file=${value}`);
    });
  }
  if (label) {
    Object.entries(label).forEach(([key, value]) => {
      cmd.push(`--label=${key}=${value}`);
    });
  }
  if (label_file) {
    label_file.forEach((value) => {
      cmd.push(`--label-file=${value}`);
    });
  }
  if (publish) {
    if (publish === "all") {
      cmd.push(`--publish-all`);
    } else {
      publish.forEach((value) => {
        cmd.push(`--publish=${value}`);
      });
    }
  }
  if (expose) {
    expose.forEach((value) => {
      cmd.push(`--expose=${value}`);
    });
  }
  if (volume) {
    volume.forEach((value) => {
      cmd.push(`--volume=${value}`);
    });
  }
  if (network === undefined || network) {
    cmd.push(`--network=${network ?? "docker"}`);
  }

  // extension
  if (add_host) {
    Object.entries(add_host).forEach(([key, value]) => {
      cmd.push(`--add-host=${key}:${value}`);
    });
  }
  if (attach) {
    cmd.push(`--attach=${attach.toLowerCase()}`);
  }
  if (cap_add) {
    cap_add.forEach((value) => {
      cmd.push(`--cap-add=${value}`);
    });
  }
  if (cap_drop) {
    cap_drop.forEach((value) => {
      cmd.push(`--cap-drop=${value}`);
    });
  }
  if (detach !== false) {
    cmd.push(`--detach`);
  }
  if (health) {
    cmd.push(`--health-cmd=${health.cmd}`);
    cmd.push(`--health-retries=${health.retries}`);
    cmd.push(`--health-interval=${health.interval}`);
    if (health.start_period) {
      cmd.push(`--health-start-period=${health.start_period}`);
    }
    if (health.timeout) {
      cmd.push(`--health-timeout=${health.timeout}`);
    }
  }
  if (hostname) {
    cmd.push(`--hostname=${hostname}`);
  }
  if (interactive) {
    cmd.push(`--interactive`);
  }
  if (privileged) {
    cmd.push(`--privileged`);
  }
  if (user) {
    cmd.push(`--user=${user}`);
  }
  if (workdir) {
    cmd.push(`--workdir=${workdir}`);
  }

  // traefik
  if (traefik) {
    const labels: Record<string, string> = {
      "traefik.enable": "true",
      "traefik.docker.network": "docker",
    };

    // prettier-ignore
    const rule = traefik.rule ?? [traefik.domain].flat().filter((d) => d).map((d) => `Host(\`${d}\`)`).join(" || ");
    const port = traefik.port ?? 80;
    const schema = traefik.schema ?? "http";
    const middlewares = [];

    // service
    if (traefik.service) {
      labels[`traefik.http.routers.${name}.service`] = traefik.service;
    } else {
      labels[`traefik.http.routers.${name}.service`] = name;
      labels[`traefik.http.services.${name}.loadbalancer.server.scheme`] = schema;
      labels[`traefik.http.services.${name}.loadbalancer.server.port`] = String(port);
    }

    // router
    if (traefik.tls) {
      // https
      labels[`traefik.http.routers.${name}.rule`] = rule;
      labels[`traefik.http.routers.${name}.entrypoints`] = "https";
      labels[`traefik.http.routers.${name}.tls.certresolver`] = typeof traefik.tls === "string" ? traefik.tls : "docker";
      // http
      labels[`traefik.http.routers.${name}-http.rule`] = rule;
      labels[`traefik.http.routers.${name}-http.entrypoints`] = "http";
      labels[`traefik.http.routers.${name}-http.middlewares`] = name + "-https";
      labels[`traefik.http.middlewares.${name}-https.redirectscheme.scheme`] = "https";
    } else {
      // http
      labels[`traefik.http.routers.${name}-http.rule`] = rule;
      labels[`traefik.http.routers.${name}-http.entrypoints`] = "http";
    }

    // middleware
    if (traefik.middlewares) {
      for (const middleware of traefik.middlewares) {
        for (const [k, v] of Object.entries(middleware.options)) {
          labels[`traefik.http.middlewares.${name}-${middleware.name}.${middleware.type}.${k}`] = v;
          middlewares.push(`${name}-${middleware.name}`);
        }
      }
    }
    if (middlewares.length) {
      labels[`traefik.http.routers.${name}.middlewares`] = middlewares.join(",");
    }

    Object.entries(labels).forEach(([key, value]) => {
      cmd.push(`--label=${key}=${value}`);
    });
  }

  // flags
  if (flags) {
    flags.forEach((value) => {
      cmd.push(value);
    });
  }

  // image & command
  cmd.push(image);
  if (command) {
    command.forEach((value) => {
      cmd.push(value);
    });
  }

  // == stop and rename old container
  const old = `${name}-old-${Date.now()}`;
  try {
    await stop(name);
    await rename(name, old);
  } catch (e) {
    // ignore
  }
  // ==

  try {
    // == start container
    logger.step(`Running container: ${name}`);
    await $exec({ cmd, type: "inherit" });
    logger.success(`Successfully run container`);
    // ==

    // == remove old container
    try {
      await remove(old, true);
    } catch (e) {
      // ignore
    }
  } catch (e) {
    logger.error(e);
    // == rollback
    try {
      await start(old);
    } catch (e) {
      // ignore
    }
    // ==
  }
  return name;
};

export const logs = async (container: string, flags: string[] = []) => {
  const cmd = ["docker", "logs", ...flags, container];

  logger.step(`Showing container logs: ${container}`);
  const logs = await $exec({ cmd }).combined;
  return logs.join("\n");
};

export const copy = async (src: string, dist: string, flags: string[] = []) => {
  const cmd = ["docker", "cp", ...flags, src, dist];

  logger.step(`Copy file to/from container: ${src} => ${dist}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully copy file to/from container`);
};

export const exec = async (container: string, command: string[], flags: string[] = []) => {
  const cmd = ["docker", "exec", ...flags, container, ...command];

  logger.step(`Exec command in container: ${container} => ${command.join(" ")}`);
  const logs = await $exec({ cmd }).combined;
  return logs.join("\n");
};

export const rename = async (name: string, rename: string) => {
  const cmd = ["docker", "rename", name, rename];

  logger.step(`Rename container: ${name} => ${rename}`);
  await $exec({ cmd, type: "inherit" });
  logger.success(`Successfully rename container`);
};

export const of = (...args: DockerOfArgs[]) => {
  const map = async (names: string[] | undefined | null) => {
    const opts: DockerOfOptions[] = await Promise.all(args.map((arg) => arg()));
    return opts.filter((o) => !names || !names.length || names.includes(o.name));
  };

  return {
    up: async (opt: any) => {
      const options = await map(opt.args);
      for (const option of options) {
        const tag = option.build ? await build(option.image, option.build) : option.image;
        await run(option.name, tag, option.run);
      }
    },
    down: async (opt: any) => {
      const options = await map(opt.args);
      for (const option of options) {
        await remove(option.name, true);
      }
    },
    build: async (opt: any) => {
      const options = await map(opt.args);
      for (const option of options) {
        await build(option.image, option.build);
      }
    },
    push: async (opt: any) => {
      const options = await map(opt.args);
      for (const option of options) {
        await push(option.image);
      }
    },
    pull: async (opt: any) => {
      const options = await map(opt.args);
      for (const option of options) {
        await pull(option.image);
      }
    },
    start: async (opt: any) => {
      const options = await map(opt.args);
      await start(options.map((o) => o.name));
    },
    stop: async (opt: any) => {
      const options = await map(opt.args);
      await stop(options.map((o) => o.name));
    },
    restart: async (opt: any) => {
      const options = await map(opt.args);
      await restart(options.map((o) => o.name));
    },
    logs: async (opt: any) => {
      const options = await map(opt.args);
      for (const option of options) {
        await logs(option.name);
      }
    },
    status: async (opt: any) => {
      const options = await map(opt.args);
      for (const option of options) {
        const s = await status(option.name);
        logger.info(`Service ${option.name} is ${s}`);
      }
    },
  };
};
