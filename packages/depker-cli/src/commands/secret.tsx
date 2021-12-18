import { CacFn } from "../types";
import React from "react";
import { useAsync } from "../hooks/use-async";
import { config } from "../config/config";
import { useAsyncEnd } from "../hooks/use-end";
import { Newline, Text } from "ink";
import { Bold } from "../components/Bold";
import { Icon } from "../components/Icon";
import { addSecret, listSecrets, removeSecret } from "@syfxlin/depker-client";
import { render } from "../utils/ink";
import { Loading } from "../components/Loading";
import { Success } from "../components/Success";
import { Error } from "../components/Error";

const ListSecret: React.FC = () => {
  const state = useAsync(() =>
    listSecrets({
      endpoint: config.endpoint,
      token: config.token as string,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Fetching..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"List secrets success!"} />
          <Newline />
          {state.data?.map((secret) => (
            <Text key={secret.name}>
              <Icon color={"yellow"}>-</Icon>
              <Bold>{secret.name}: </Bold>
              <Text>{secret.value}</Text>
              <Newline />
            </Text>
          ))}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"List secrets error:"} error={state.error} />
      )}
    </>
  );
};

export const AddSecret: React.FC<{ name: string; value: string }> = ({
  name,
  value,
}) => {
  const state = useAsync(() =>
    addSecret({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
      value,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Adding..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Add secret success!"} />
          <Newline />
          {state.data && (
            <Text key={state.data.name}>
              <Icon color={"yellow"}>+</Icon>
              <Bold>{state.data.name}: </Bold>
              <Text>{state.data.value}</Text>
            </Text>
          )}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Add secret error:"} error={state.error} />
      )}
    </>
  );
};

export const RemoveSecret: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    removeSecret({
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
          <Success message={"Remove secret success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Remove secret error:"} error={state.error} />
      )}
    </>
  );
};

export const secretCmd: CacFn = (cli) => {
  // list
  cli
    .command("secret:list", "List your secrets")
    .alias("secret")
    .action(() => {
      render(<ListSecret />);
    });
  // add
  cli
    .command("secret:add <name> <value>", "Create a new secret")
    .action((name, value) => {
      render(<AddSecret name={name} value={value} />);
    });
  // remove
  cli.command("secret:remove <name>", "Remove a secret").action((name) => {
    render(<RemoveSecret name={name} />);
  });
};
