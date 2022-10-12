import React, { ReactNode } from "react";
import { SWRResponse } from "swr";
import { AxiosError } from "axios";
import { Alerting } from "./Alerting";
import { Anchor } from "@mantine/core";
import { Loading } from "./Loading";

export type AsyncProps<T, E extends AxiosError<any>> = JSX.IntrinsicElements["div"] & {
  query: SWRResponse<T, E>;
  children: ReactNode;
};

export function Async<T, E extends AxiosError<any>>({ query, children, ...props }: AsyncProps<T, E>) {
  // error
  if (query.error) {
    const message = query.error.response?.data?.message ?? query.error.message;
    return (
      <Alerting>
        {message instanceof Array ? message.join(", ") : message}
        <br />
        <Anchor color="red" onClick={() => query.mutate()}>
          Retry?
        </Anchor>
      </Alerting>
    );
  }
  // loading
  if (!query.data) {
    return <Loading />;
  }
  // success
  return <>{React.isValidElement(children) ? React.cloneElement(children, props) : children}</>;
}
