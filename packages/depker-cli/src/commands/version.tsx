import React from "react";
import { useAsync } from "../hooks/use-async";
import { version } from "@syfxlin/depker-client";
import { config } from "../config/config";
import { useAsyncEnd } from "../hooks/use-end";
import { Loading } from "../components/Loading";
import { Newline, Text } from "ink";
import { Icon } from "../components/Icon";
import { Bold } from "../components/Bold";
import { Error } from "../components/Error";
import { Space } from "../components/Space";
import packageJson from "../../package.json";
import { CacFn } from "../types";
import { render } from "../utils/ink";

export const Version: React.FC = () => {
  const state = useAsync(() =>
    version({
      endpoint: config.endpoint,
    })
  );

  useAsyncEnd(state);

  return (
    <Text>
      <Text>
        <Icon color={"yellow"}>-</Icon>
        <Bold>depker-cli:</Bold>
        <Space />
        <Text>{packageJson.version}</Text>
        <Newline />
      </Text>
      {state.status === "loading" && <Loading message={"Fetching..."} />}
      {state.status === "success" && (
        <Text>
          <Icon color={"yellow"}>-</Icon>
          <Bold>depker-server:</Bold>
          <Space />
          <Text>{state.data?.version}</Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Get server version error:"} error={state.error} />
      )}
    </Text>
  );
};

export const versionCmd: CacFn = (cli) => {
  cli.command("version", "Show depker versions").action(() => {
    render(<Version />);
  });
};
