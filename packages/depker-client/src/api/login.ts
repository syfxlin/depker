import ServerError from "../error/ServerError";
import got from "got";

export type LoginProps = {
  endpoint: string;
  token: string;
};

export const login = async ({ endpoint, token }: LoginProps) => {
  try {
    return await got
      .post(`${endpoint}/login`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        token: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const loginByToken = async ({ endpoint, token }: LoginProps) => {
  try {
    return await got
      .post(`${endpoint}/login/token`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        token: string;
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};
