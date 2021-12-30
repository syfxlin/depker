import { CacFn } from "../types";
import React from "react";
import { useAsync } from "../hooks/use-async";
import {
  addPlugin,
  execPlugin,
  listPlugins,
  removePlugin,
} from "@syfxlin/depker-client";
import { config } from "../config/config";
import { useAsyncEnd } from "../hooks/use-end";
import { Loading } from "../components/Loading";
import { Newline, Text } from "ink";
import { Success } from "../components/Success";
import { Error } from "../components/Error";
import yaml from "yaml";
import { render } from "../utils/ink";
import { Icon } from "../components/Icon";
import { Bold } from "../components/Bold";

export const ExecPlugin: React.FC<{
  name: string;
  command: string;
  args: string[];
}> = ({ name, command, args }) => {
  const state = useAsync(() =>
    execPlugin({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
      command,
      args,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Executing..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Exec plugin success!"} />
          <Newline />
          <Text color={"cyan"}>=========================</Text>
          <Newline />
          {yaml.stringify(state.data)}
          <Text color={"cyan"}>=========================</Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Exec plugin error:"} error={state.error} />
      )}
    </>
  );
};

const ListPlugin: React.FC = () => {
  const state = useAsync(() =>
    listPlugins({
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
          {state.data.plugins.map((plugin) => (
            <Text key={plugin}>
              <Icon color={"yellow"}>-</Icon>
              <Bold>{plugin}</Bold>
              <Newline />
            </Text>
          ))}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"List plugins error:"} error={state.error} />
      )}
    </>
  );
};

export const AddPlugin: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    addPlugin({
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
          <Success message={"Add plugin success!"} />
          <Newline />
          {state.data && (
            <Text key={name}>
              <Icon color={"yellow"}>+</Icon>
              <Bold>{name}</Bold>
            </Text>
          )}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Add plugin error:"} error={state.error} />
      )}
    </>
  );
};

export const RemovePlugin: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    removePlugin({
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
          <Success message={"Remove plugin success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Remove plugin error:"} error={state.error} />
      )}
    </>
  );
};

export const pluginCmd: CacFn = (cli) => {
  // exec
  cli
    .command("plugin:exec <cmd> [...args]", "Exec plugin command")
    .alias("plugin")
    .action(async (cmd, args) => {
      const [name, command] = cmd.split(":");
      render(<ExecPlugin name={name} command={command} args={args} />);
    });
  // list
  cli.command("plugin:list", "List your plugins").action(() => {
    render(<ListPlugin />);
  });
  // add
  cli.command("plugin:add <name>", "Create a new plugin").action((name) => {
    render(<AddPlugin name={name} />);
  });
  // remove
  cli.command("plugin:remove <name>", "Remove a plugin").action((name) => {
    render(<RemovePlugin name={name} />);
  });
};
