import { config, docker, logger } from "../bin";
import { IMAGES, IS_DEV, NAMES, VOLUMES } from "../constants/depker.constant";
import { Command } from "commander";

export class TraefikService {
  constructor(private readonly cli: Command) {}

  public async ports(operate?: "insert" | "remove", ports?: number[]) {
    const values = await config.remote();
    const current = (values.ports ?? []).map((p) => parseInt(p));
    const set = new Set<number>(current);
    if (!operate || !ports?.length) {
      return [...set];
    }
    if (operate === "insert" && !ports.find((p) => !set.has(p))) {
      return [...set];
    }
    if (operate === "remove" && !ports.find((p) => set.has(p))) {
      return [...set];
    }
    if (operate === "insert") {
      for (const port of ports) {
        set.add(port);
      }
    }
    if (operate === "remove") {
      for (const port of ports) {
        set.delete(port);
      }
    }
    // prettier-ignore
    logger.debug(`The current port status does not match the requirements and is in the process of reloading traefik. current=${current}, required=${ports}`);
    const results = [...set];
    values.ports = results.map((p) => String(p));
    await config.remote(values);
    await this.reload();
    return results;
  }

  public async reload() {
    const values = await config.remote();

    const _traefik = async () => {
      logger.debug(`Traefik reloading started.`);

      // find traefik
      const traefik = await docker.containers.find(NAMES.TRAEFIK);
      if (traefik) {
        logger.debug(`Found an existing traefik instance that has started to be deleted.`);
        await docker.containers.remove(traefik.ID, true);
      }

      // values
      const id = String(Date.now());
      const envs: Record<string, string> = {
        DEPKER_ID: id,
        DEPKER_TYPE: "app",
        DEPKER_NAME: NAMES.TRAEFIK,
        DEPKER_IMAGE: IMAGES.TRAEFIK,
        // log
        TRAEFIK_LOG: "true",
        TRAEFIK_LOG_LEVEL: "info",
        TRAEFIK_LOG_FILEPATH: "/var/traefik/traefik.log",
        // access-log
        TRAEFIK_ACCESSLOG: "true",
        TRAEFIK_ACCESSLOG_FILEPATH: "/var/traefik/traefik-access.log",
        TRAEFIK_ACCESSLOG_BUFFERINGSIZE: "100",
        // dashboard
        TRAEFIK_API: "true",
        TRAEFIK_API_DASHBOARD: "true",
        ...(IS_DEV ? { TRAEFIK_API_INSECURE: "true" } : {}),
        // healthcheck
        TRAEFIK_PING: "true",
        // entry points
        TRAEFIK_ENTRYPOINTS_HTTP: "true",
        TRAEFIK_ENTRYPOINTS_HTTP_ADDRESS: ":80",
        TRAEFIK_ENTRYPOINTS_HTTPS: "true",
        TRAEFIK_ENTRYPOINTS_HTTPS_ADDRESS: ":443",
        ...(values.ports ?? []).reduce(
          (a, p) => ({
            [`TRAEFIK_ENTRYPOINTS_TCP${p}`]: "true",
            [`TRAEFIK_ENTRYPOINTS_TCP${p}_ADDRESS`]: `:${p}/tcp`,
            [`TRAEFIK_ENTRYPOINTS_UDP${p}`]: "true",
            [`TRAEFIK_ENTRYPOINTS_UDP${p}_ADDRESS`]: `:${p}/udp`,
          }),
          {}
        ),
        // providers
        TRAEFIK_PROVIDERS_DOCKER: "true",
        TRAEFIK_PROVIDERS_DOCKER_ENDPOINT: "unix:///var/run/docker.sock",
        TRAEFIK_PROVIDERS_DOCKER_EXPOSEDBYDEFAULT: "false",
        // certificates
        [`TRAEFIK_CERTIFICATESRESOLVERS_${NAMES.DEPKER}`]: "true",
        [`TRAEFIK_CERTIFICATESRESOLVERS_${NAMES.DEPKER}_ACME_EMAIL`]: values.mail,
        [`TRAEFIK_CERTIFICATESRESOLVERS_${NAMES.DEPKER}_ACME_STORAGE`]: "/var/traefik/acme.json",
        ...(!values.traefik?.challenge || values.traefik?.challenge === "http"
          ? {
              [`TRAEFIK_CERTIFICATESRESOLVERS_${NAMES.DEPKER}_ACME_HTTPCHALLENGE`]: "true",
              [`TRAEFIK_CERTIFICATESRESOLVERS_${NAMES.DEPKER}_ACME_HTTPCHALLENGE_ENTRYPOINT`]: "http",
            }
          : {
              [`TRAEFIK_CERTIFICATESRESOLVERS_${NAMES.DEPKER}_ACME_DNSCHALLENGE`]: "true",
              [`TRAEFIK_CERTIFICATESRESOLVERS_${NAMES.DEPKER}_ACME_DNSCHALLENGE_PROVIDER`]: values.traefik.challenge,
            }),
        ...values.traefik?.envs,
      };
      const labels: Record<string, string> = {
        "depker.id": id,
        "depker.type": "app",
        "depker.name": NAMES.TRAEFIK,
        "depker.image": IMAGES.TRAEFIK,
        "traefik.enable": "true",
        "traefik.docker.network": NAMES.DEPKER,
        ...(values.traefik?.dashboard
          ? {
              [`traefik.http.routers.traefik.entrypoints`]: "https",
              [`traefik.http.routers.traefik.rule`]: `Host(\`${values.traefik.dashboard}\`)`,
              [`traefik.http.routers.traefik.service`]: "api@internal",
              [`traefik.http.routers.traefik.middlewares`]: "traefik-auth",
              [`traefik.http.routers.traefik.tls.certresolver`]: NAMES.DEPKER,
              [`traefik.http.middlewares.traefik-auth.basicauth.users`]: `${values.mail}:${values.pass}`,
            }
          : {}),
        ...values.traefik?.labels,
      };

      // create traefik container
      const container = await docker.containers.create(NAMES.TRAEFIK, IMAGES.TRAEFIK, {
        restart: "always",
        envs: envs,
        labels: labels,
        networks: [await docker.networks.depker()],
        volumes: [`${VOLUMES.TRAEFIK}:/var/traefik`, `/var/run/docker.sock:/var/run/docker.sock`],
        ports: [
          `80:80/tcp`,
          `443:443/tcp`,
          `443:443/udp`,
          ...(IS_DEV ? [`8080:8080/tcp`] : []),
          ...(values.ports ?? []).map((p) => `${p}:${p}/tcp`),
          ...(values.ports ?? []).map((p) => `${p}:${p}/udp`),
        ],
      });

      // start container
      await docker.containers.start(container);

      logger.debug(`Traefik reloading successfully.`);
    };

    const _logrotate = async () => {
      logger.debug(`Logrotate reloading started.`);

      // find logrotate
      const logrotate = await docker.containers.find(NAMES.LOGROTATE);
      if (logrotate) {
        logger.debug(`Found an existing logrotate instance that has started to be deleted.`);
        await docker.containers.remove(logrotate.ID, true);
      }

      // values
      const id = String(Date.now());
      const envs: Record<string, string> = {
        DEPKER_ID: id,
        DEPKER_TYPE: "app",
        DEPKER_NAME: NAMES.LOGROTATE,
        DEPKER_IMAGE: IMAGES.LOGROTATE,
        LOGROTATE_LOGS: "/var/traefik/*.log",
        LOGROTATE_TRIGGER_INTERVAL: values.logrotate?.trigger_interval ?? "weekly",
        LOGROTATE_TRIGGER_SIZE: values.logrotate?.trigger_size ?? "50M",
        LOGROTATE_MAX_BACKUPS: values.logrotate?.max_backups ?? "5",
        LOGROTATE_START_INDEX: "1",
        CRON_SCHEDULE: "* * * * *",
        CRON_LOG_LEVEL: "8",
        TRAEFIK_CONTAINER_ID_COMMAND: "docker ps --quiet --filter ancestor=traefik",
      };
      const labels: Record<string, string> = {
        "depker.id": id,
        "depker.type": "app",
        "depker.name": NAMES.LOGROTATE,
        "depker.image": IMAGES.LOGROTATE,
      };

      // create traefik container
      const container = await docker.containers.create(NAMES.LOGROTATE, IMAGES.LOGROTATE, {
        restart: "always",
        envs: envs,
        labels: labels,
        networks: [await docker.networks.depker()],
        volumes: [`${VOLUMES.LOGROTATE}:/var/traefik`, `/var/run/docker.sock:/var/run/docker.sock`],
      });

      // start container
      await docker.containers.start(container);

      logger.debug(`Traefik reloading successfully.`);
    };

    await _traefik();
    await _logrotate();
  }

  public async start() {
    await Promise.all([docker.containers.start(NAMES.TRAEFIK), docker.containers.start(NAMES.LOGROTATE)]);
  }

  public async restart() {
    await Promise.all([docker.containers.restart(NAMES.TRAEFIK), docker.containers.restart(NAMES.LOGROTATE)]);
  }

  public async stop() {
    await Promise.all([docker.containers.stop(NAMES.TRAEFIK), docker.containers.stop(NAMES.LOGROTATE)]);
  }

  public async remove(force?: boolean) {
    await Promise.all([
      docker.containers.remove(NAMES.TRAEFIK, force),
      docker.containers.remove(NAMES.LOGROTATE, force),
    ]);
  }
}
