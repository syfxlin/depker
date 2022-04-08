import {
  DefinitionsNetwork,
  DefinitionsService as DefinitionsServiceV1,
  DefinitionsVolume,
} from "../types/docker-compose.ts";

export type DefinitionsService = DefinitionsServiceV1 & {
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
};

export type DockerComposeFileOptions = {
  services: { [name: string]: DefinitionsService };
  networks: { [name: string]: DefinitionsNetwork };
  volumes: { [name: string]: DefinitionsVolume };
};

export type DockerComposeOptions = {
  env?: Record<string, string>;
  env_files?: string[];
  composefile?: string[];
  composefile_contents?: any[];
};

export type DockerComposeUpOptions = {
  scale?: Record<string, number>;
  start?: boolean;
  build?: boolean;
  detach?: boolean;
  recreate?: boolean;
  deps?: boolean;
};

export type DockerComposeDownOptions = {
  rmi?: string;
  volumes?: string[];
};

export type DockerComposeBuildOptions = {
  build_args?: Record<string, string>;
  cache?: boolean;
  pull?: boolean;
};

export type DockerComposeExecOptions = {
  index?: number;
  env?: Record<string, string>;
  detach?: boolean;
  user?: string;
  workdir?: string;
};

const arg = (args: string[], ...values: string[]) => {
  args.push(...values);
};

export const file = (
  project: string,
  options: Partial<DockerComposeFileOptions>
) => {
  const values: DockerComposeFileOptions = {
    services: depker.clone(options.services ?? {}),
    networks: depker.clone(options.networks ?? {}),
    volumes: depker.clone(options.volumes ?? {}),
  };

  // services
  for (const [key, value] of Object.entries(values.services)) {
    const name = `${project}-${key}`;
    // patch default config
    value.restart = value.restart ?? "always";
    value.deploy = value.deploy ?? {};
    value.deploy.replicas = value.deploy.replicas ?? 1;

    // traefik config
    const traefik = value.traefik;
    // prettier-ignore
    if (traefik) {
      const labels: Record<string, string> = {
        "traefik.enable": "true",
        "traefik.docker.network": "docker",
      };

      const rule = traefik.rule ?? [traefik.domain].flat().filter((d) => d).map((d) => `Host(\`${d}\`)`).join(" || ");
      const port = traefik.port ?? 80;
      const schema = traefik.schema ?? "http";
      const middlewares = [];

      // service
      if (traefik.service) {
        labels[`traefik.http.routers.${name}.service`] = traefik.service;
      } else {
        labels[`traefik.http.routers.${name}.service`] = name;
        labels[`traefik.http.services.${name}.loadbalancer.server.scheme`] = schema
        labels[`traefik.http.services.${name}.loadbalancer.server.port`] = String(port)
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

      value.labels = { ...value.labels, ...labels };
    }
    delete value.traefik;

    // networks config
    // prettier-ignore
    if (value.networks) {
      const networks = value.networks instanceof Array ? value.networks : Object.keys(value.networks);
      for (const network of networks) {
        if (!values.networks[network]) {
          // @ts-ignore
          value.networks[network] = {}
        }
      }
    }

    // volumes config
    // prettier-ignore
    if (value.volumes) {
      for (const volume of value.volumes) {
        if (!values.volumes[volume]) {
          values.volumes[volume] = {};
        }
      }
    }
  }

  // networks
  values.networks["default"] = {
    // @ts-ignore
    name: "docker",
    external: true,
  };

  return { version: "3.9", ...values };
};

export const of = (name: string, options?: DockerComposeOptions) => {
  const { env, env_files, composefile, composefile_contents } = options ?? {};

  const rootCmd = [
    "docker",
    "compose",
    "--project-name",
    name,
    "--project-directory",
    ".",
  ];

  // prettier-ignore
  if (env) {
    const file = depker.tmp.file("depker-envfile", Object.entries(env).map(([name, value]) => `${name}=${value}`).join("\n"));
    arg(rootCmd, "--env-file", file);
  }
  if (env_files) {
    env_files.forEach((e) => arg(rootCmd, "--env-file", e));
  }
  if (composefile) {
    composefile.forEach((c) => arg(rootCmd, "--file", c));
  }
  if (composefile_contents) {
    // prettier-ignore
    composefile_contents.forEach((value) => {
      const file = depker.tmp.file("depker-composefile", typeof value === "string" ? value : depker.yaml.stringify(value));
      arg(rootCmd, "--file", file);
    })
  }

  const up = async (options?: DockerComposeUpOptions) => {
    const { start, build, scale, detach, recreate, deps } = options ?? {};

    const cmd = [...rootCmd, "up"];

    if (start === false) {
      arg(cmd, "--no-start");
    }
    if (build === true) {
      arg(cmd, "--build");
    } else if (build === false) {
      arg(cmd, "--no-build");
    }
    if (scale) {
      Object.entries(scale).forEach(([service, scale]) =>
        arg(cmd, "--scale", `${service}=${scale}`)
      );
    }
    if (detach !== false) {
      arg(cmd, "--detach");
    }
    if (recreate === true) {
      arg(cmd, "--force-recreate");
    } else if (recreate === false) {
      arg(cmd, "--no-recreate");
    }
    if (deps === false) {
      arg(cmd, "--no-deps");
    }

    depker.logger.step(`Up docker-compose services: ${name}`);
    await depker.exec({
      cmd,
      output: "inherit",
    });
    depker.logger.success(`Successfully up docker-compose services`);
  };

  const down = async (options?: DockerComposeDownOptions) => {
    const { rmi, volumes } = options ?? {};

    const cmd = [...rootCmd, "down"];

    if (rmi) {
      arg(cmd, "--rmi", rmi);
    }
    if (volumes) {
      volumes.forEach((v) => arg(cmd, "--volumes", v));
    }

    depker.logger.step(`Down docker-compose services: ${name}`);
    await depker.exec({
      cmd,
      output: "inherit",
    });
    depker.logger.success(`Successfully down docker-compose services`);
  };

  const build = async (options?: DockerComposeBuildOptions) => {
    const { build_args, cache, pull } = options ?? {};

    const cmd = [...rootCmd, "build"];

    if (build_args) {
      Object.entries(build_args).forEach(([key, value]) =>
        arg(cmd, "--build-arg", `${key}=${value}`)
      );
    }
    if (cache === false) {
      arg(cmd, "--no-cache");
    }
    if (pull === false) {
      arg(cmd, "--pull");
    }

    depker.logger.step(`Build docker-compose services: ${name}`);
    await depker.exec({
      cmd,
      output: "inherit",
    });
    depker.logger.success(`Successfully build docker-compose services`);
  };

  const copy = async (src: string, dist: string, index?: number) => {
    const cmd = [...rootCmd, "cp", "--archive", "--follow-link"];

    if (index) {
      arg(cmd, "--index", String(index));
    } else {
      arg(cmd, "--all");
    }

    arg(cmd, src, dist);

    depker.logger.step(
      `Copy file to/from docker-compose services: ${src} => ${dist}`
    );
    await depker.exec({
      cmd,
      output: "inherit",
    });
    depker.logger.success(
      `Successfully copy file to/from docker-compose services`
    );
  };

  const exec = async (
    service: string,
    command: string[],
    options?: DockerComposeExecOptions
  ) => {
    const { env, detach, user, workdir, index } = options ?? {};

    const cmd = [...rootCmd, "exec"];

    if (env) {
      Object.entries(env).forEach(([key, value]) =>
        arg(cmd, "--env", `${key}=${value}`)
      );
    }
    if (detach) {
      arg(cmd, "--detach");
    }
    if (user) {
      arg(cmd, "--user", user);
    }
    if (workdir) {
      arg(cmd, "--workdir", workdir);
    }
    if (index) {
      arg(cmd, "--index", String(index));
    }

    arg(cmd, service);
    arg(cmd, ...command);

    depker.logger.step(
      `Exec command in docker-compose service: ${service} => ${command.join(
        " "
      )}`
    );
    return await depker.exec({
      cmd,
      output: "piped",
    });
  };

  const logs = async (service: string, follow?: boolean) => {
    const cmd = [...rootCmd, "logs", ...(follow ? ["--follow"] : []), service];
    depker.logger.step(`Showing docker-compose service logs: ${service}`);
    return await depker.exec({
      cmd,
      output: "piped",
    });
  };

  const pull = async (service?: string | string[]) => {
    const services = [service].flat().filter((s) => s) as string[];
    depker.logger.step(
      `Pulling docker-compose service image: ${services.join(", ")}`
    );
    await depker.exec({
      cmd: [...rootCmd, "pull", ...services],
      output: "inherit",
    });
    depker.logger.success(`Successfully pull image`);
  };

  const push = async (service?: string | string[]) => {
    const services = [service].flat().filter((s) => s) as string[];
    depker.logger.step(
      `Pushing docker-compose service image: ${services.join(", ")}`
    );
    await depker.exec({
      cmd: [...rootCmd, "push", ...services],
      output: "inherit",
    });
    depker.logger.success(`Successfully push image`);
  };

  const start = async (service?: string | string[]) => {
    const services = [service].flat().filter((s) => s) as string[];
    depker.logger.step(`Start docker-compose service: ${services.join(", ")}`);
    await depker.exec({
      cmd: [...rootCmd, "start", ...services],
      output: "inherit",
    });
    depker.logger.success(`Successfully start docker-compose service`);
  };

  const stop = async (service?: string | string[]) => {
    const services = [service].flat().filter((s) => s) as string[];
    depker.logger.step(`Stop docker-compose service: ${services.join(", ")}`);
    await depker.exec({
      cmd: [...rootCmd, "stop", ...services],
      output: "inherit",
    });
    depker.logger.success(`Successfully stop docker-compose service`);
  };

  const restart = async (service?: string | string[]) => {
    const services = [service].flat().filter((s) => s) as string[];
    depker.logger.step(
      `Restart docker-compose service: ${services.join(", ")}`
    );
    await depker.exec({
      cmd: [...rootCmd, "restart", ...services],
      output: "inherit",
    });
    depker.logger.success(`Successfully restart docker-compose service`);
  };

  const remove = async (service?: string | string[], force?: boolean) => {
    const services = [service].flat().filter((s) => s) as string[];
    depker.logger.step(`Remove docker-compose service: ${services.join(", ")}`);
    await depker.exec({
      cmd: [...rootCmd, "rm", ...(force ? ["--force"] : []), ...services],
      output: "inherit",
    });
    depker.logger.success(`Successfully remove docker-compose service`);
  };

  return {
    up,
    down,
    build,
    copy,
    exec,
    logs,
    pull,
    push,
    start,
    stop,
    restart,
    remove,
  };
};

export const deployment = (
  name: string,
  content: Partial<DockerComposeFileOptions>,
  options?: Omit<DockerComposeOptions, "composefile" | "composefile_contents">
) => {
  const compose = of(name, {
    ...options,
    composefile_contents: [file(name, content)],
  });
  const update = async (service?: string | string[]) => {
    let services = [service].flat().filter((s) => s) as string[];
    if (!services.length) {
      services = Object.keys(content.services ?? {});
    }
    depker.logger.step(`Update docker-compose service: ${services.join(", ")}`);
    await compose.up({
      detach: true,
      deps: false,
      recreate: false,
      // @ts-ignore
      scale: services.reduce((all, s) => ({ ...all, [s]: 2 }), {}),
    });
    for (const s of services) {
      const ps = await depker.exec({
        cmd: ["docker", "ps", "-q", "-f", `name=${s}`],
        output: "piped",
      });
      const id = depker.text.decode(ps.stdout).trim().split("\n")[0];
      depker.logger.step(
        `Removing old docker-compose service container id: ${s} => ${id}`
      );
      await depker.exec({
        cmd: ["docker", "rm", "-f", id],
        output: "piped",
      });
    }
    await compose.up({
      detach: true,
      deps: false,
      recreate: false,
      // @ts-ignore
      scale: services.reduce((all, s) => ({ ...all, [s]: 1 }), {}),
    });
    await compose.up();
    depker.logger.success(`Successfully update docker-compose service`);
  };
  return {
    ...compose,
    update,
  };
};
