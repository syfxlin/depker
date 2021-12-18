import { CacFn } from "../types";
import { render } from "../utils/ink";
import React, { useState } from "react";
import { deploy } from "@syfxlin/depker-client";
import { config } from "../config/config";
import { Socket } from "socket.io-client";
import { Logger } from "../components/Logger";
import { resolve } from "path";
import { Newline, Text } from "ink";
import { Bold } from "../components/Bold";
import { Icon } from "../components/Icon";
import { Space } from "../components/Space";
import { useEndFn } from "../hooks/use-end";
import { Loading } from "../components/Loading";

const colors = {
  info: "blue",
  verbose: "cyan",
  warn: "yellow",
  error: "red",
};

const Deploy: React.FC<{ socket: Socket; verbose: boolean }> = ({
  socket,
  verbose,
}) => {
  const end = useEndFn();
  const [deploying, setDeploying] = useState(true);
  return (
    <>
      <Logger
        socket={socket}
        onEnd={() => {
          setDeploying(false);
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
              {item.level === "info" && item.stream && (
                <Text>
                  <Space count={4} />
                  <Text>{item.stream.replaceAll("\n", "")}</Text>
                </Text>
              )}
              {item.level === "verbose" && item.stream && (
                <Text>
                  <Space count={4} />
                  <Text>{item.stream.replaceAll("\n", "")}</Text>
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
      {deploying && <Loading message={"Deploying..."} />}
    </>
  );
};

export const deployCmd: CacFn = (cli) => {
  cli
    .command("deploy:local", "Deploy your app to depker")
    .alias("deploy")
    .option("-v, --verbose", "Show verbose log")
    .option("-f, --folder <folder>", "Select deploy folder", {
      default: process.cwd(),
    })
    .action((options) => {
      const socket = deploy({
        endpoint: config.endpoint,
        token: config.token as string,
        folder: resolve(options.folder),
      });
      render(<Deploy socket={socket} verbose={options.verbose} />);
    });
};
