import { CacFn } from "../types";
import React, { useState } from "react";
import { Socket } from "socket.io-client";
import { useEndFn } from "../hooks/use-end";
import { Logger } from "../components/Logger";
import { Newline, Text } from "ink";
import { Bold } from "../components/Bold";
import { Icon } from "../components/Icon";
import { Space } from "../components/Space";
import { Loading } from "../components/Loading";
import { config } from "../config/config";
import { render } from "../utils/ink";
import { restore, restoreAll } from "@syfxlin/depker-client";

const colors = {
  info: "blue",
  verbose: "cyan",
  warn: "yellow",
  error: "red",
};

const Restore: React.FC<{ socket: Socket; verbose: boolean }> = ({
  socket,
  verbose,
}) => {
  const end = useEndFn();
  const [restoring, setRestoring] = useState(true);
  return (
    <>
      <Logger
        socket={socket}
        onEnd={() => {
          setRestoring(false);
          end();
        }}
      >
        {(item, index) =>
          (item.level !== "verbose" || verbose) && (
            <Text key={index}>
              {item.message !== "progress" && (
                <Bold color={colors[item.level]}>
                  <Icon color={"yellow"}>-</Icon>
                  {item.message}
                </Bold>
              )}
              {item.level === "info" && (
                <Text>
                  <Space count={4} />
                  <Text>
                    {item.stream?.replaceAll("\n", "")}
                    {item.id ? `${item.id}: ` : null}
                    {item.status}
                    {item.progress ? ` ${item.progress}` : null}
                  </Text>
                </Text>
              )}
              {item.level === "verbose" && (
                <Text>
                  <Space count={4} />
                  <Text>
                    {item.stream?.replaceAll("\n", "")}
                    {item.id ? `${item.id}: ` : null}
                    {item.status}
                    {item.progress ? ` ${item.progress}` : null}
                  </Text>
                </Text>
              )}
              {item.level === "error" && item.error && (
                <>
                  <Newline />
                  <Text color={"red"}>
                    <Space count={4} />
                    <Text>{item.error.replaceAll("\n", "")}</Text>
                  </Text>
                </>
              )}
            </Text>
          )
        }
      </Logger>
      {restoring && <Loading message={"Restoring..."} />}
    </>
  );
};

export const restoreCmd: CacFn = (cli) => {
  // restore by name
  cli
    .command("restore:app <name>", "Restore your app to depker")
    .alias("restore")
    .option("-v, --verbose", "Show verbose log")
    .action((name, options) => {
      const socket = restore({
        endpoint: config.endpoint,
        token: config.token as string,
        name,
      });
      render(<Restore socket={socket} verbose={options.verbose} />);
    });
  cli
    .command("restore:all", "Restore your all apps to depker")
    .option("-v, --verbose", "Show verbose log")
    .action((options) => {
      const socket = restoreAll({
        endpoint: config.endpoint,
        token: config.token as string,
      });
      render(<Restore socket={socket} verbose={options.verbose} />);
    });
};
