export type DockerBuildOptions = {
  // base
  dockerfile?: string;
  dockerfile_contents?: string;
  pull?: boolean;
  push?: boolean;
  // values
  extra_tags?: string[];
  build_args?: Record<string, string>; // arg_name, arg_value
  labels?: Record<string, string>; // label_name, label_value
  secrets?: Record<string, string>; // secret_id, secret_src
  // ext
  ssh?: Record<string, string>; // ssh_id, ssh_socket or ssh_key
  // extra args
  add_hosts?: Record<string, string>;
  compress?: boolean;
  cache?: boolean | string[];
  // flags
  flags?: string[];
};

export type DockerExecOptions = {
  detach?: boolean;
  env?: Record<string, string>;
  env_files?: string[];
  interactive?: boolean;
  user?: string;
  workdir?: string;
};

export type DockerRunOptions = {
  // base
  command?: string[];
  entrypoint?: string[];
  init?: boolean;
  restart?: "no" | "always" | "on-failure" | `on-failure:${number}`;
  pull?: boolean;
  rm?: boolean;
  // values
  volumes?: string[];
  publish?: string[];
  expose?: string[];
  env?: Record<string, string>;
  env_files?: string[];
  labels?: Record<string, string>;
  label_files?: string[];
  // ext
  add_hosts?: Record<string, string>;
  attach?: ("stdin" | "stdout" | "stderr")[];
  cap_add?: string[];
  cap_drop?: string[];
  detach?: boolean; // default true
  privileged?: boolean;
  hostname?: string;
  network?: string[];
  workdir?: string;
  interactive?: boolean;
  user?: string;
  // flags
  flags?: string[];
};

const arg = (args: string[], ...values: string[]) => {
  args.push(...values);
};

export const context = async (context: string) => {
  depker.logger.info(`Switch docker context: ${context}`);
  await depker.exec({
    cmd: ["docker", "context", "use", context],
    output: "inherit",
  });
};

export const login = async (
  server: string,
  username: string,
  password: string
) => {
  depker.logger.info(`Login docker registry: ${server}`);
  await depker.exec({
    cmd: [
      "docker",
      "login",
      "--username",
      username,
      "--password",
      password,
      server,
    ],
    output: "inherit",
  });
};

export const build = async (image: string, options?: DockerBuildOptions) => {
  const {
    dockerfile,
    dockerfile_contents,
    pull,
    push: $push,
    extra_tags,
    build_args,
    labels,
    secrets,
    ssh,
    add_hosts,
    compress,
    cache,
    flags,
  } = options ?? {};

  if (dockerfile && dockerfile_contents) {
    throw new Error(
      "Cannot specify both dockerfile and dockerfile_contents keyword arguments"
    );
  }

  const tag = `depker-${Date.now()}`;
  const cmd: string[] = ["docker", "build", "--tag", `${image}:${tag}`];

  // config
  if (pull) {
    arg(cmd, "--pull");
  }
  if (extra_tags) {
    extra_tags.forEach((tag) => arg(cmd, "--tag", `${image}:${tag}`));
  }
  if (build_args) {
    Object.entries(build_args).forEach(([key, value]) =>
      arg(cmd, "--build-arg", `${key}=${value}`)
    );
  }
  if (labels) {
    Object.entries(labels).forEach(([key, value]) =>
      arg(cmd, "--label", `${key}=${value}`)
    );
  }
  if (secrets) {
    Object.entries(secrets).forEach(([id, src]) =>
      arg(cmd, "--secret", `id=${id},src=${src}`)
    );
  }
  if (ssh) {
    Object.entries(ssh).forEach(([id, value]) =>
      arg(cmd, "--ssh", `${id}=${value}`)
    );
  }
  if (add_hosts) {
    Object.entries(add_hosts).forEach(([host, ip]) =>
      arg(cmd, "--add-host", `${host}:${ip}`)
    );
  }
  if (cache === false) {
    arg(cmd, "--no-cache");
  }
  if (typeof cache !== "boolean" && cache) {
    cache.forEach((c) => arg(cmd, "--cache-from", c));
  }
  if (compress) {
    arg(cmd, "--compress");
  }

  // dockerfile
  arg(cmd, "--file");
  if (dockerfile) {
    arg(cmd, dockerfile);
  } else if (dockerfile_contents) {
    arg(cmd, depker.tmp.file("depker-dockerfile", dockerfile_contents));
  } else {
    arg(cmd, `./Dockerfile`);
  }
  // context
  arg(cmd, ".");

  // flags
  if (flags) {
    arg(cmd, ...flags);
  }

  // build
  depker.logger.step(`Building docker image: ${image}:${tag}`);
  await depker.exec({
    cmd,
    output: "inherit",
  });
  depker.logger.success(`Successfully build image`);

  // push
  if ($push) {
    await push(image, tag);
  } else {
    depker.logger.info(`Skip push image`);
  }

  return `${image}:${tag}`;
};

export const push = async (image: string, tag: string | string[]) => {
  const tags = [tag].flat();

  for (const t of tags) {
    depker.logger.step(`Pushing docker image: ${image}:${t}`);
    await depker.exec({
      cmd: ["docker", "push", `${image}:${t}`],
      output: "inherit",
    });
    depker.logger.success(`Successfully push image`);
  }
};

export const pull = async (image: string, tag: string | string[]) => {
  const tags = [tag].flat();

  for (const t of tags) {
    depker.logger.step(`Pulling docker image: ${image}:${t}`);
    await depker.exec({
      cmd: ["docker", "pull", `${image}:${t}`],
      output: "inherit",
    });
    depker.logger.success(`Successfully pull image`);
  }
};

export const start = async (container: string | string[]) => {
  const containers = [container].flat();
  depker.logger.step(`Start container: ${containers.join(", ")}`);
  await depker.exec({
    cmd: ["docker", "start", ...containers],
    output: "inherit",
  });
  depker.logger.success(`Successfully start container`);
};

export const stop = async (container: string | string[]) => {
  const containers = [container].flat();
  depker.logger.step(`Stop container: ${containers.join(", ")}`);
  await depker.exec({
    cmd: ["docker", "stop", ...containers],
    output: "inherit",
  });
  depker.logger.success(`Successfully stop container`);
};

export const restart = async (container: string | string[]) => {
  const containers = [container].flat();
  depker.logger.step(`Restart container: ${containers.join(", ")}`);
  await depker.exec({
    cmd: ["docker", "restart", ...containers],
    output: "inherit",
  });
  depker.logger.success(`Successfully restart container`);
};

export const remove = async (container: string | string[], force?: boolean) => {
  const containers = [container].flat().filter((s) => s);
  depker.logger.step(`Remove container: ${containers.join(", ")}`);
  await depker.exec({
    cmd: ["docker", "rm", ...(force ? ["--force"] : []), ...containers],
    output: "inherit",
  });
  depker.logger.success(`Successfully remove container`);
};

export const logs = async (container: string, follow?: boolean) => {
  depker.logger.step(`Showing container logs: ${container}`);
  return await depker.exec({
    cmd: ["docker", "logs", ...(follow ? ["--follow"] : []), container],
    output: "piped",
  });
};

export const exec = async (
  container: string,
  command: string[],
  options?: DockerExecOptions
) => {
  const { detach, env, env_files, interactive, user, workdir } = options ?? {};

  const cmd = ["docker", "exec"];
  if (detach) {
    arg(cmd, "--detach");
  }
  if (env) {
    Object.entries(env).forEach(([key, value]) =>
      arg(cmd, "--env", `${key}=${value}`)
    );
  }
  if (env_files) {
    env_files.forEach((file) => arg(cmd, "--env-file", file));
  }
  if (interactive) {
    arg(cmd, "--interactive");
  }
  if (user) {
    arg(cmd, "--user", user);
  }
  if (workdir) {
    arg(cmd, "--workdir", workdir);
  }

  arg(cmd, container);
  arg(cmd, ...command);

  depker.logger.step(
    `Exec command in container: ${container} => ${command.join(" ")}`
  );
  return await depker.exec({
    cmd,
    output: "piped",
  });
};

export const copy = async (src: string, dist: string) => {
  depker.logger.step(`Copy file to/from container: ${src} => ${dist}`);
  await depker.exec({
    cmd: ["docker", "cp", "--archive", "--follow-link", src, dist],
    output: "inherit",
  });
  depker.logger.success(`Successfully copy file to/from container`);
};

export const run = async (
  name: string,
  image: string,
  options?: DockerRunOptions
) => {
  const {
    command,
    entrypoint,
    init,
    restart,
    pull,
    rm,
    volumes,
    publish,
    expose,
    env,
    env_files,
    labels,
    label_files,
    add_hosts,
    attach,
    cap_add,
    cap_drop,
    detach,
    privileged,
    hostname,
    network,
    workdir,
    interactive,
    user,
    flags,
  } = options ?? {};

  const cmd = ["docker", "run", "--name", name];

  if (entrypoint) {
    arg(cmd, "--entrypoint", entrypoint.join(" "));
  }
  if (init) {
    arg(cmd, "--init");
  }
  if (restart) {
    arg(cmd, "--restart", restart);
  }
  if (pull) {
    arg(cmd, "--pull");
  }
  if (rm) {
    arg(cmd, "--rm");
  }
  if (volumes) {
    volumes.forEach((v) => arg(cmd, "-v", v));
  }
  if (publish) {
    publish.forEach((p) => arg(cmd, "-p", p));
  }
  if (expose) {
    expose.forEach((e) => arg(cmd, "--expose", e));
  }
  if (env) {
    Object.entries(env).forEach(([name, value]) =>
      arg(cmd, "--env", `${name}=${value}`)
    );
  }
  if (env_files) {
    env_files.forEach((file) => arg(cmd, "--env-file", file));
  }
  if (labels) {
    Object.entries(labels).forEach(([name, value]) =>
      arg(cmd, "--label", `${name}=${value}`)
    );
  }
  if (label_files) {
    label_files.forEach((file) => arg(cmd, "--label-file", file));
  }
  if (add_hosts) {
    Object.entries(add_hosts).forEach(([host, ip]) =>
      arg(cmd, "--add-host", `${host}:${ip}`)
    );
  }
  if (attach) {
    attach.forEach((a) => arg(cmd, "--attach", a));
  }
  if (cap_add) {
    cap_add.forEach((a) => arg(cmd, "--cap-add", a));
  }
  if (cap_drop) {
    cap_drop.forEach((a) => arg(cmd, "--cap-drop", a));
  }
  if (detach !== false) {
    arg(cmd, "--detach");
  }
  if (privileged) {
    arg(cmd, "--privileged");
  }
  if (hostname) {
    arg(cmd, "--hostname", hostname);
  }
  if (network) {
    network.forEach((n) => arg(cmd, "--network", n));
  }
  if (workdir) {
    arg(cmd, "--workdir", workdir);
  }
  if (interactive) {
    arg(cmd, "--interactive");
  }
  if (user) {
    arg(cmd, "--user", user);
  }
  if (flags) {
    arg(cmd, ...flags);
  }

  arg(cmd, image);

  if (command) {
    arg(cmd, ...command);
  }

  depker.logger.step(`Running container: ${name}`);
  await depker.exec({
    cmd,
    output: "inherit",
  });
  depker.logger.success(`Successfully run container`);

  return name;
};
