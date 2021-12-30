import ServerError from "../error/ServerError";
import got from "got";

export type ListAppsProps = {
  endpoint: string;
  token: string;
  state?: "all" | "running" | "exited" | "ready" | "paused";
};

export type RemoveAppProps = {
  endpoint: string;
  token: string;
  name: string;
  force?: boolean;
};

export type RestartAppProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type StartAppProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type StopAppProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type AppInfoProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listApps = async ({ endpoint, token, state }: ListAppsProps) => {
  try {
    return await got
      .get(`${endpoint}/apps`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        searchParams: {
          state,
        },
      })
      .json<{
        message: string;
        apps: {
          id: string;
          name: string;
          container: string;
          created: number;
          status: string;
          state: "running" | "exited" | "ready" | "paused";
        }[];
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const removeApp = async ({
  endpoint,
  token,
  name,
  force,
}: RemoveAppProps) => {
  try {
    return await got
      .delete(`${endpoint}/apps/${name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        searchParams: {
          force,
        },
      })
      .json<{
        message: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const restartApp = async ({
  endpoint,
  token,
  name,
}: RestartAppProps) => {
  try {
    return await got
      .post(`${endpoint}/apps/${name}/restart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const startApp = async ({ endpoint, token, name }: StartAppProps) => {
  try {
    return await got
      .post(`${endpoint}/apps/${name}/start`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const stopApp = async ({ endpoint, token, name }: StopAppProps) => {
  try {
    return await got
      .post(`${endpoint}/apps/${name}/stop`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const appInfo = async ({ endpoint, token, name }: AppInfoProps) => {
  try {
    return await got
      .get(`${endpoint}/apps/${name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        info: {
          id: string;
          name: string;
          container: string;
          image: string;
          command: string;
          created: number;
          ports: string[];
          labels: string[];
          state: "running" | "exited" | "ready" | "paused";
          status: string;
          networks: string[];
          networkMode: string;
          mounts: string[];
        };
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};
