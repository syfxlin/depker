import { io } from "socket.io-client";
import ServerError from "../error/ServerError";

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

export const listStorages = ({ endpoint, token }: ListStoragesProps) => {
  return new Promise<{
    message: string;
    storages: string[];
  }>((resolve, reject) => {
    const socket = io(`${endpoint}/storages`, {
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
        storages: res.storages,
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

export const addStorage = ({ endpoint, token, name }: AddStorageProps) => {
  return new Promise<{ message: string; name: string; path: string }>(
    (resolve, reject) => {
      const socket = io(`${endpoint}/storages`, {
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
          name: res.name,
          path: res.path,
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
    }
  );
};

export const removeStorage = ({
  endpoint,
  token,
  name,
}: RemoveStorageProps) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const socket = io(`${endpoint}/storages`, {
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
