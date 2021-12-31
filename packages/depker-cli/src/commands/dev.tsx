import { CacFn } from "../types";
import { exec, logs, prune } from "@syfxlin/depker-client";
import { config } from "../config/config";
import React from "react";
import { useAsync } from "../hooks/use-async";
import { useAsyncEnd } from "../hooks/use-end";
import { Loading } from "../components/Loading";
import { Success } from "../components/Success";
import { Error } from "../components/Error";
import { render } from "../utils/ink";
import { PassThrough } from "stream";

export const Prune: React.FC = () => {
  const state = useAsync(() =>
    prune({
      endpoint: config.endpoint,
      token: config.token as string,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Pruning..."} />}
      {state.status === "success" && (
        <Success message={"Prune docker success!"} />
      )}
      {state.status === "error" && (
        <Error message={"Prune docker error:"} error={state.error} />
      )}
    </>
  );
};

export const devCmd: CacFn = (cli) => {
  // exec
  cli
    .command("dev:exec <name> [...command]", "Exec command in app")
    .action(async (name, command) => {
      try {
        const stdin = new PassThrough();
        const stdout = new PassThrough();
        process.stdin.pipe(stdin);
        stdout.pipe(process.stdout);
        await exec({
          endpoint: config.endpoint,
          token: config.token as string,
          name,
          command,
          stdin,
          stdout,
        });
      } finally {
        process.exit();
      }
    });
  // logs
  cli
    .command("dev:logs <name>", "Get container logs in app")
    .option("-f, --follow", "Keep connection after returning logs")
    .action(async (name, options) => {
      const request = await logs({
        endpoint: config.endpoint,
        token: config.token as string,
        name,
        follow: options.follow,
      });
      request.pipe(process.stdout);
      request.on("end", () => {
        process.exit();
      });
    });
  // prune
  cli.command("dev:prune", "Prune docker in depker").action(() => {
    render(<Prune />);
  });
};
