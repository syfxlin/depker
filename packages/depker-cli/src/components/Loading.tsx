import React from "react";
import { Text } from "ink";
import s from "ink-spinner";
import { Bold } from "./Bold";
import { Space } from "./Space";

export type LoadingProps = {
  message: string;
};

export const Loading: React.FC<LoadingProps> = ({ message, children }) => {
  return (
    <Text>
      <Text color={"blue"}>
        {/* @ts-ignore */}
        <s.default type={"dots"} />
      </Text>
      <Space />
      <Bold>{message}</Bold>
      {children}
    </Text>
  );
};
