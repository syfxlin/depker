import ServerError from "../error/ServerError";
import got from "got";

export type ListSecretsProps = {
  endpoint: string;
  token: string;
};

export type AddSecretProps = {
  endpoint: string;
  token: string;
  name: string;
  value: string;
};

export type RemoveSecretProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listSecrets = async ({ endpoint, token }: ListSecretsProps) => {
  try {
    return await got
      .get(`${endpoint}/secrets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        secrets: { name: string; value: string }[];
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const addSecret = async ({
  endpoint,
  token,
  name,
  value,
}: AddSecretProps) => {
  try {
    return await got
      .post(`${endpoint}/secrets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: {
          name,
          value,
        },
      })
      .json<{
        message: string;
        name: string;
        value: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const removeSecret = async ({
  endpoint,
  token,
  name,
}: RemoveSecretProps) => {
  try {
    return await got
      .delete(`${endpoint}/secrets/${name}`, {
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
