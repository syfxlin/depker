import React, { useMemo } from "react";
import { Icon } from "./Icon";
import { Bold } from "./Bold";
import { Space } from "./Space";
import { Newline, Text } from "ink";

export type ErrorProps = {
  message: string;
  error: Error | null | undefined;
};

export const Error: React.FC<ErrorProps> = ({ message, error, children }) => {
  const messages = useMemo(() => {
    let curr = error;
    const texts: React.ReactElement[] = [];
    while (curr) {
      texts.push(
        <React.Fragment key={texts.length}>
          <Newline />
          <Text>
            <Space count={2} />
            <Icon>-</Icon>
            {curr.message}
          </Text>
        </React.Fragment>
      );
      // @ts-ignore
      curr = curr.cause;
    }
    return texts;
  }, [error]);
  return (
    <Text color={"red"}>
      <Icon>×</Icon>
      <Bold>{message}</Bold>
      {messages}
      {children}
    </Text>
  );
};
