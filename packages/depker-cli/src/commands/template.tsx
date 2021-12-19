import { CacFn } from "../types";
import React from "react";
import { useAsync } from "../hooks/use-async";
import { config } from "../config/config";
import { useAsyncEnd } from "../hooks/use-end";
import { Newline, Text } from "ink";
import { Bold } from "../components/Bold";
import { Icon } from "../components/Icon";
import {
  addTemplate,
  listTemplates,
  removeTemplate,
} from "@syfxlin/depker-client";
import { render } from "../utils/ink";
import { Loading } from "../components/Loading";
import { Success } from "../components/Success";
import { Error } from "../components/Error";

const ListTemplate: React.FC = () => {
  const state = useAsync(() =>
    listTemplates({
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
          {state.data.templates.map((template) => (
            <Text key={template}>
              <Icon color={"yellow"}>-</Icon>
              <Bold>{template}</Bold>
              <Newline />
            </Text>
          ))}
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"List templates error:"} error={state.error} />
      )}
    </>
  );
};

export const AddTemplate: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    addTemplate({
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
          <Success message={"Add template success!"} />
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
        <Error message={"Add template error:"} error={state.error} />
      )}
    </>
  );
};

export const RemoveTemplate: React.FC<{ name: string }> = ({ name }) => {
  const state = useAsync(() =>
    removeTemplate({
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
          <Success message={"Remove template success!"} />
          <Newline />
          <Text key={name}>
            <Icon color={"yellow"}>-</Icon>
            <Bold>{name}</Bold>
          </Text>
        </Text>
      )}
      {state.status === "error" && (
        <Error message={"Remove template error:"} error={state.error} />
      )}
    </>
  );
};

export const templateCmd: CacFn = (cli) => {
  // list
  cli
    .command("template:list", "List your templates")
    .alias("template")
    .action(() => {
      render(<ListTemplate />);
    });
  // add
  cli.command("template:add <name>", "Create a new template").action((name) => {
    render(<AddTemplate name={name} />);
  });
  // remove
  cli.command("template:remove <name>", "Remove a template").action((name) => {
    render(<RemoveTemplate name={name} />);
  });
};
