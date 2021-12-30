import ServerError from "../error/ServerError";
import got from "got";

export type ListStoragesProps = {
  endpoint: string;
  token: string;
};

export type AddStorageProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RemoveStorageProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listStorages = async ({ endpoint, token }: ListStoragesProps) => {
  try {
    return await got
      .get(`${endpoint}/storages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        storages: string[];
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const addStorage = async ({
  endpoint,
  token,
  name,
}: AddStorageProps) => {
  try {
    return await got
      .post(`${endpoint}/storages/${name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        name: string;
        path: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const removeStorage = async ({
  endpoint,
  token,
  name,
}: RemoveStorageProps) => {
  try {
    return await got
      .delete(`${endpoint}/storages/${name}`, {
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
