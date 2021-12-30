import got from "got";
import ServerError from "../error/ServerError";
import { PassThrough } from "stream";

export type RestoreProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RestoreAllProps = {
  endpoint: string;
  token: string;
};

export const restore = async ({ endpoint, token, name }: RestoreProps) => {
  try {
    const pipe = new PassThrough();
    const stream = got.stream.post(`${endpoint}/restore/${name}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    pipe.pipe(stream);
    pipe.end();
    return stream;
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const restoreAll = ({ endpoint, token }: RestoreAllProps) => {
  try {
    const pipe = new PassThrough();
    const stream = got.stream.post(`${endpoint}/restore/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    pipe.pipe(stream);
    pipe.end();
    return stream;
  } catch (e: any) {
    throw new ServerError(e);
  }
};
