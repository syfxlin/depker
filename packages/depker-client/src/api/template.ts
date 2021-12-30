import ServerError from "../error/ServerError";
import got from "got";

export type ListTemplatesProps = {
  endpoint: string;
  token: string;
};

export type AddTemplateProps = {
  endpoint: string;
  token: string;
  name: string;
};

export type RemoveTemplateProps = {
  endpoint: string;
  token: string;
  name: string;
};

export const listTemplates = async ({
  endpoint,
  token,
}: ListTemplatesProps) => {
  try {
    return await got
      .get(`${endpoint}/templates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{
        message: string;
        templates: string[];
      }>();
  } catch (e: any) {
    throw new ServerError(e);
  }
};

export const addTemplate = async ({
  endpoint,
  token,
  name,
}: AddTemplateProps) => {
  try {
    return await got
      .post(`${endpoint}/templates/${encodeURIComponent(name)}`, {
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

export const removeTemplate = async ({
  endpoint,
  token,
  name,
}: RemoveTemplateProps) => {
  try {
    return await got
      .delete(`${endpoint}/templates/${encodeURIComponent(name)}`, {
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
