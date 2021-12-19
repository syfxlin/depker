import { CacFn } from "../types";
import React from "react";
import { useAsync } from "../hooks/use-async";
import { config } from "../config/config";
import { useAsyncEnd } from "../hooks/use-end";
import { Newline, Text } from "ink";
import { Bold } from "../components/Bold";
import { Icon } from "../components/Icon";
import {
  addStorage,
  listStorages,
  removeStorage,
} from "@syfxlin/depker-client";
import { render } from "../utils/ink";
import { Loading } from "../components/Loading";
import { Success } from "../components/Success";
import { Error } from "../components/Error";

const ListStorage: React.FC = () => {
  const state = useAsync(() =>
    listStorages({
      endpoint: config.endpoint,
      token: config.token as string,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Fetching..."} />}
      {state.status === "success" && state.data && (
        <Text>
          <Success message={state.data.message} />
          <Newline />
          {state.data.storages.map((storage) => (
            <Text key={storage}>
              <Icon color={"yellow"}>-</Icon>
              <Bold>{storage}</Bold>
              <Newline />
            </Text>
          ))}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"List storages error:"} error={state.error} />
      )}
    </>
  );
};

export const AddStorage: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    addStorage({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Adding..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Add storage success!"} />
          <Newline />
          {state.data && (
            <Text key={state.data.name}>
              <Icon color={"yellow"}>+</Icon>
              <Bold>{state.data.name}: </Bold>
              <Text>{state.data.path}</Text>
            </Text>
          )}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Add storage error:"} error={state.error} />
      )}
    </>
  );
};

export const RemoveStorage: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    removeStorage({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Removing..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Remove storage success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Remove storage error:"} error={state.error} />
      )}
    </>
  );
};

export const storageCmd: CacFn = (cli) => {
  // list
  cli
    .command("storage:list", "List your storages")
    .alias("storage")
    .action(() => {
      render(<ListStorage />);
    });
  // add
  cli.command("storage:add <name>", "Create a new storage").action((name) => {
    render(<AddStorage name={name} />);
  });
  // remove
  cli.command("storage:remove <name>", "Remove a storage").action((name) => {
    render(<RemoveStorage name={name} />);
  });
};
