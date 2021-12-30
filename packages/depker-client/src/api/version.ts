import ServerError from "../error/ServerError";
import got from "got";

export type VersionProps = {
  endpoint: string;
};

export const version = async ({ endpoint }: VersionProps) => {
  try {
    return await got.get(`${endpoint}/version`).json<{
      message: string;
      version: string;
    }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};
