import ServerError from "../error/ServerError";
import got from "got";

export type PluginProps = {
  endpoint: string;
  token: string;
  name: string;
  command: string;
  args?: string[];
};

export type ListPluginsProps = {
  endpoint: string;
  token: string;
};

export type AddPluginProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RemovePluginProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const execPlugin = async <R = any>({
  endpoint,
  token,
  name,
  command,
  args,
}: PluginProps) => {
  try {
    return await got
      .post(`${endpoint}/plugin-${name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: {
          command,
          args,
        },
      })
      .json<R>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const listPlugins = async ({ endpoint, token }: ListPluginsProps) => {
  try {
    return await got
      .get(`${endpoint}/plugins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        plugins: string[];
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const addPlugin = async ({ endpoint, token, name }: AddPluginProps) => {
  try {
    return await got
      .post(`${endpoint}/plugins/${encodeURIComponent(name)}`, {
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

export const removePlugin = async ({
  endpoint,
  token,
  name,
}: RemovePluginProps) => {
  try {
    return await got
      .delete(`${endpoint}/plugins/${encodeURIComponent(name)}`, {
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
