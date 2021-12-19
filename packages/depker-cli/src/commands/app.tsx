import { CacFn } from "../types";
import { render } from "../utils/ink";
import React from "react";
import { useAsync } from "../hooks/use-async";
import {
  appInfo,
  listApps,
  removeApp,
  restartApp,
  startApp,
  stopApp,
} from "@syfxlin/depker-client";
import { config } from "../config/config";
import { useAsyncEnd } from "../hooks/use-end";
import { Loading } from "../components/Loading";
import { Newline, Text } from "ink";
import { Success } from "../components/Success";
import { Icon } from "../components/Icon";
import { Bold } from "../components/Bold";
import { Error } from "../components/Error";
import { Space } from "../components/Space";

const colors: Record<string, "green" | "red"> = {
  running: "green",
  exited: "red",
};

const ListApp: React.FC<{ state: string }> = ({ state: s }) => {
  const state = useAsync(() =>
    listApps({
      endpoint: config.endpoint,
      token: config.token as string,
      state: s as any,
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
          {state.data.apps.map((app) => (
            <Text key={app.id}>
              <Icon color={"yellow"}>-</Icon>
              <Bold color={"blue"}>
                {app.name} ({app.container},{app.id.substring(0, 10)}):
              </Bold>
              <Space />
              <Text color={colors[app.state] ?? "yellow"}>{app.state}</Text>
              <Newline />
              <Space count={4} />
              <Text color={"cyan"}>Status:</Text>
              <Space />
              <Text>{app.status}</Text>
              <Newline />
              <Space count={4} />
              <Text color={"cyan"}>Created:</Text>
              <Space />
              <Text>{new Date(app.created).toLocaleString()}</Text>
              <Newline />
            </Text>
          ))}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"List apps error:"} error={state.error} />
      )}
    </>
  );
};

export const RemoveApp: React.FC<{ name: string; force: boolean }> = ({
  name,
  force,
}) => {
  const state = useAsync(() =>
    removeApp({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
      force,
    })
  );

  useAsyncEnd(state);

  return (
    <Text>
      {state.status === "loading" && <Loading message={"Removing..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Remove app success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Remove app error:"} error={state.error} />
      )}
    </Text>
  );
};

export const RestartApp: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    restartApp({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
    })
  );

  useAsyncEnd(state);

  return (
    <Text>
      {state.status === "loading" && <Loading message={"Restarting..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Restart app success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Restart app error:"} error={state.error} />
      )}
    </Text>
  );
};

export const StartApp: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    startApp({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
    })
  );

  useAsyncEnd(state);

  return (
    <Text>
      {state.status === "loading" && <Loading message={"Starting..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Start app success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Start app error:"} error={state.error} />
      )}
    </Text>
  );
};

export const StopApp: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    stopApp({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
    })
  );

  useAsyncEnd(state);

  return (
    <Text>
      {state.status === "loading" && <Loading message={"Stopping..."} />}
      {state.status === "success" && (
        <Text>
          <Success message={"Stop app success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Stop app error:"} error={state.error} />
      )}
    </Text>
  );
};

const AppInfo: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    appInfo({
      endpoint: config.endpoint,
      token: config.token as string,
      name,
    })
  );

  useAsyncEnd(state);

  return (
    <Text>
      {state.status === "loading" && <Loading message={"Fetching..."} />}
      {state.status === "success" && state.data && (
        <Text>
          <Success message={state.data.message} />
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Name:</Bold>
            <Space />
            <Text>{state.data.info.name}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>ID:</Bold>
            <Space />
            <Text>{state.data.info.id}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Container:</Bold>
            <Space />
            <Text>{state.data.info.container}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Image:</Bold>
            <Space />
            <Text>{state.data.info.image}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Command:</Bold>
            <Space />
            <Text>{state.data.info.command}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Created:</Bold>
            <Space />
            <Text>{new Date(state.data.info.created).toLocaleString()}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>State:</Bold>
            <Space />
            <Text>{state.data.info.state}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Status:</Bold>
            <Space />
            <Text>{state.data.info.status}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>NetworkMode:</Bold>
            <Space />
            <Text>{state.data.info.networkMode}</Text>
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Ports:</Bold>
            {state.data.info.ports.map((port) => (
              <Text key={port}>
                <Newline />
                <Space count={2} />
                <Icon color={"magenta"}>-</Icon>
                {port}
              </Text>
            ))}
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Labels:</Bold>
            {state.data.info.labels.map((label) => (
              <Text key={label}>
                <Newline />
                <Space count={2} />
                <Icon color={"magenta"}>-</Icon>
                {label}
              </Text>
            ))}
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Networks:</Bold>
            {state.data.info.networks.map((network) => (
              <Text key={network}>
                <Newline />
                <Space count={2} />
                <Icon color={"magenta"}>-</Icon>
                {network}
              </Text>
            ))}
          </Text>
          <Newline />
          <Text>
            <Icon color={"yellow"}>-</Icon>
            <Bold color={"cyan"}>Mounts:</Bold>
            {state.data.info.mounts.map((mount) => (
              <Text key={mount}>
                <Newline />
                <Space count={2} />
                <Icon color={"magenta"}>-</Icon>
                {mount}
              </Text>
            ))}
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Stop app error:"} error={state.error} />
      )}
    </Text>
  );
};

export const appCmd: CacFn = (cli) => {
  // list apps
  cli
    .command("app:list", "List your apps")
    .alias("app")
    .option("-s,--state <state>", "List by status apps")
    .action((options) => {
      render(<ListApp state={options.state} />);
    });
  // remove app
  cli
    .command("app:remove <name>", "Remove your app")
    .option("-f, --force", "Force remove app")
    .action((name, options) => {
      render(<RemoveApp name={name} force={options.force} />);
    });
  // restart app
  cli.command("app:restart <name>", "Restart your app").action((name) => {
    render(<RestartApp name={name} />);
  });
  // start app
  cli.command("app:start <name>", "Start your app").action((name) => {
    render(<StartApp name={name} />);
  });
  // stop app
  cli.command("app:stop <name>", "Stop your app").action((name) => {
    render(<StopApp name={name} />);
  });
  // app info
  cli.command("app:info <name>", "Show your app info").action((name) => {
    render(<AppInfo name={name} />);
  });
};
