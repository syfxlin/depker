import { CacFn } from "../types";
import { render } from "../utils/ink";
import React, { useState } from "react";
import { deploy, deployTar } from "@syfxlin/depker-client";
import { config } from "../config/config";
import { Socket } from "socket.io-client";
import { Logger } from "../components/Logger";
import { join, resolve } from "path";
import { Newline, Text } from "ink";
import { Bold } from "../components/Bold";
import { Icon } from "../components/Icon";
import { Space } from "../components/Space";
import { useEndFn } from "../hooks/use-end";
import { Loading } from "../components/Loading";
import fs from "fs-extra";
import gitP from "simple-git";
import { dir } from "../config/dir";
import { randomUUID } from "crypto";

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
      {deploying && <Loading message={"Deploying..."} />}
    </>
  );
};

export const deployCmd: CacFn = (cli) => {
  // deploy by folder
  cli
    .command("deploy:local [folder]", "Deploy your app to depker")
    .alias("deploy")
    .option("-v, --verbose", "Show verbose log")
    .action((folder, options) => {
      const socket = deploy({
        endpoint: config.endpoint,
        token: config.token as string,
        folder: resolve(folder || process.cwd()),
      });
      render(<Deploy socket={socket} verbose={options.verbose} />);
    });
  // deploy by tar file
  cli
    .command(
      "deploy:archive <file>",
      "Deploy your app from tar archive to depker"
    )
    .alias("deploy:tar")
    .option("-v, --verbose", "Show verbose log")
    .action((file, options) => {
      const socket = deployTar({
        endpoint: config.endpoint,
        token: config.token as string,
        tar: fs.createReadStream(resolve(file)),
      });
      render(<Deploy socket={socket} verbose={options.verbose} />);
    });
  // deploy by git
  cli
    .command("deploy:git <repo>", "Deploy your app from git to depker")
    .alias("deploy:repo <repo>")
    .option("-v, --verbose", "Show verbose log")
    .action(async (repo, options) => {
      const git = gitP();
      const folder = join(dir.deploying, `git-${randomUUID()}`);
      await git.clone(repo, folder);
      const socket = deploy({
        endpoint: config.endpoint,
        token: config.token as string,
        folder,
      });
      render(<Deploy socket={socket} verbose={options.verbose} />, {
        exit: async () => {
          await fs.remove(folder);
        },
      });
    });
};
