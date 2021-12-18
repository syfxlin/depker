import React, { useState } from "react";
import { CacFn } from "../types";
import { Newline, Text } from "ink";
import { login, loginByToken } from "@syfxlin/depker-client";
import { config, updateConfig } from "../config/config";
import { UncontrolledTextInput } from "ink-text-input";
import { render } from "../utils/ink";
import Link from "ink-link";
import { Icon } from "../components/Icon";
import { Bold } from "../components/Bold";
import { Space } from "../components/Space";
import { useAsyncEnd, useEnd } from "../hooks/use-end";
import { useAsync } from "../hooks/use-async";
import { Loading } from "../components/Loading";
import { Success } from "../components/Success";
import { Error } from "../components/Error";

type LoginStatus = "input" | "loading" | "finish" | "error";

const Login: React.FC = () => {
  const [status, setStatus] = useState<LoginStatus>("input");
  const [error, setError] = useState<Error | null>(null);

  const onSubmit = async (value: string) => {
    try {
      setStatus("loading");
      const token = await login({
        endpoint: config.endpoint,
        token: value,
      });
      updateConfig({ token });
      setStatus("finish");
    } catch (e) {
      setError(e as Error);
      setStatus("error");
    }
  };

  useEnd(status === "finish" || (status === "error" && error));

  return (
    <Text>
      <Icon color={"green"}>!</Icon>
      <Bold>Logging into:</Bold>
      <Space />
      <Link url={config.endpoint}>{config.endpoint}</Link>
      <Newline />
      {status === "input" && (
        <Text>
          <Icon color={"green"}>?</Icon>
          <Bold>Enter your token: </Bold>
          <UncontrolledTextInput
            mask={"*"}
            onSubmit={(value) => onSubmit(value)}
          />
        </Text>
      )}
      {status === "loading" && <Loading message={"Logging..."} />}
      {status === "finish" && <Success message={"Login success!"} />}
      {status === "error" && <Error message={"Login error:"} error={error} />}
    </Text>
  );
};

const LoginByToken: React.FC<{ token: string }> = ({ token }) => {
  const state = useAsync(() =>
    loginByToken({
      endpoint: config.endpoint,
      token,
    })
  );

  useAsyncEnd(state);

  return (
    <>
      {state.status === "loading" && <Loading message={"Logging..."} />}
      {state.status === "success" && <Success message={"Login success!"} />}
      {state.status === "error" && (
        <Error message={"Login error:"} error={state.error} />
      )}
    </>
  );
};

export const loginCmd: CacFn = (cli) => {
  // login by default
  cli.command("login", "Login your depker").action(() => {
    render(<Login />);
  });
  // login by token
  cli
    .command("login:token <token>", "Login your depker by token")
    .action((token) => {
      render(<LoginByToken token={token} />);
    });
};
