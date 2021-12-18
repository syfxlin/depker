import React from "react";
import { Text } from "ink";
import Spinner from "ink-spinner";
import { Bold } from "./Bold";
import { Space } from "./Space";

export type LoadingProps = {
  message: string;
};

export const Loading: React.FC<LoadingProps> = ({ message, children }) => {
  return (
    <Text>
      <Text color={"blue"}>
        <Spinner type={"dots"} />
      </Text>
      <Space />
      <Bold>{message}</Bold>
      {children}
    </Text>
  );
};
