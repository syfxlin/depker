import ServerError from "../error/ServerError";
import got from "got";

export type ListTokensProps = {
  endpoint: string;
  token: string;
};

export type AddTokenProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RemoveTokenProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listTokens = async ({ endpoint, token }: ListTokensProps) => {
  try {
    return await got
      .get(`${endpoint}/tokens`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        tokens: { name: string; token: string }[];
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const addToken = async ({ endpoint, token, name }: AddTokenProps) => {
  try {
    return await got
      .post(`${endpoint}/tokens/${name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        name: string;
        token: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const removeToken = async ({
  endpoint,
  token,
  name,
}: RemoveTokenProps) => {
  try {
    return await got
      .delete(`${endpoint}/tokens/${name}`, {
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
