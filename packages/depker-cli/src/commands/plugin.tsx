import { CacFn } from "../types";
import React from "react";
import { useAsync } from "../hooks/use-async";
import { execPlugin } from "@syfxlin/depker-client";
import { config } from "../config/config";
import { useAsyncEnd } from "../hooks/use-end";
import { Loading } from "../components/Loading";
import { Newline, Text } from "ink";
import { Success } from "../components/Success";
import { Error } from "../components/Error";
import yaml from "yaml";
import { render } from "../utils/ink";

export const ExecPlugin: React.FC<{ command: string; args: string[] }> = ({
  command,
  args,
}) => {
  const state = useAsync(() =>
    execPlugin({
      endpoint: config.endpoint,
      token: config.token as string,
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

export const pluginCmd: CacFn = (cli) => {
  cli
    .command("plugin:exec <command> [...args]", "Exec plugin command")
    .alias("plugin")
    .action(async (command, args) => {
      render(<ExecPlugin command={command} args={args} />);
    });
};
