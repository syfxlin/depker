import { CacFn } from "../types";
import React from "react";
import { useAsync } from "../hooks/use-async";
import { addToken, listTokens, removeToken } from "@syfxlin/depker-client";
import { config } from "../config/config";
import { Newline, Text } from "ink";
import { Icon } from "../components/Icon";
import { render } from "../utils/ink";
import { Bold } from "../components/Bold";
import { useAsyncEnd } from "../hooks/use-end";
import { Success } from "../components/Success";
import { Error } from "../components/Error";
import { Loading } from "../components/Loading";

const ListToken: React.FC = () => {
  const state = useAsync(() =>
    listTokens({
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
          <Success message={"List tokens success!"} />
          <Newline />
          {state.data?.map((token) => (
            <Text key={token.token}>
              <Icon color={"yellow"}>-</Icon>
              <Bold>{token.name}: </Bold>
              <Text>{token.token}</Text>
              <Newline />
            </Text>
          ))}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"List tokens error:"} error={state.error} />
      )}
    </>
  );
};

export const AddToken: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    addToken({
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
          <Success message={"Add token success!"} />
          <Newline />
          {state.data && (
            <Text key={state.data.token}>
              <Icon color={"yellow"}>+</Icon>
              <Bold>{state.data.name}: </Bold>
              <Text>{state.data.token}</Text>
            </Text>
          )}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Add token error:"} error={state.error} />
      )}
    </>
  );
};

export const RemoveToken: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    removeToken({
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
          <Success message={"Remove token success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Remove token error:"} error={state.error} />
      )}
    </>
  );
};

export const tokenCmd: CacFn = (cli) => {
  // list
  cli
    .command("token:list", "List your tokens")
    .alias("token")
    .action(() => {
      render(<ListToken />);
    });
  // add
  cli.command("token:add <name>", "Create a new token").action((name) => {
    render(<AddToken name={name} />);
  });
  // remove
  cli.command("token:remove <name>", "Remove a token").action((name) => {
    render(<RemoveToken name={name} />);
  });
};
