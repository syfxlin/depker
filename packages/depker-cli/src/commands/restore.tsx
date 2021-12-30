import { CacFn } from "../types";
import React, { useState } from "react";
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
import parser from "stream-json/jsonl/Parser";

const colors = {
  info: "blue",
  verbose: "cyan",
  warn: "yellow",
  error: "red",
};

const Restore: React.FC<{
  stream: NodeJS.ReadableStream;
  verbose: boolean;
}> = ({ stream, verbose }) => {
  const end = useEndFn();
  const [restoring, setRestoring] = useState(true);
  return (
    <>
      <Logger
        stream={stream}
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
    .action(async (name, options) => {
      const request = await restore({
        endpoint: config.endpoint,
        token: config.token as string,
        name,
      });
      render(
        <Restore
          stream={request.pipe(parser.parser())}
          verbose={options.verbose}
        />
      );
    });
  cli
    .command("restore:all", "Restore your all apps to depker")
    .option("-v, --verbose", "Show verbose log")
    .action(async (options) => {
      const request = await restoreAll({
        endpoint: config.endpoint,
        token: config.token as string,
      });
      render(
        <Restore
          stream={request.pipe(parser.parser())}
          verbose={options.verbose}
        />
      );
    });
};
