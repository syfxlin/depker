import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

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

export const listTemplates = ({ endpoint, token }: ListTemplatesProps) => {
  return new Promise<{
    message: string;
    templates: string[];
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/templates`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("list");
    });
    socket.on("ok", (res) => {
      resolve({
        message: res.message,
        templates: res.templates,
      });
    });
    socket.on("error", (res) => {
      reject(
        new ServerError(
          res.message,
          res.error ? new Error(res.error) : undefined
        )
      );
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};

export const addTemplate = ({ endpoint, token, name }: AddTemplateProps) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const socket = io(`${endpoint}/templates`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("add", name);
    });
    socket.on("ok", (res) => {
      resolve({
        message: res.message,
      });
    });
    socket.on("error", (res) => {
      reject(
        new ServerError(
          res.message,
          res.error ? new Error(res.error) : undefined
        )
      );
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};

export const removeTemplate = ({
  endpoint,
  token,
  name,
}: RemoveTemplateProps) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const socket = io(`${endpoint}/templates`, {
      auth: {
        token,
      },
    });
    socket.on("connect", () => {
      socket.emit("remove", name);
    });
    socket.on("ok", (res) => {
      resolve(res);
    });
    socket.on("error", (res) => {
      reject(
        new ServerError(
          res.message,
          res.error ? new Error(res.error) : undefined
        )
      );
    });
    socket.on("connect_error", (err) => {
      reject(new ServerError("Connect error!", err));
    });
  });
};
