import React from "react";
import { Icon } from "./Icon";
import { Bold } from "./Bold";
import { Text } from "ink";

export type SuccessProps = {
  message: string;
};

export const Success: React.FC<SuccessProps> = ({ message, children }) => {
  return (
    <Text color={"green"}>
      <Icon>✓</Icon>
      <Bold>{message}</Bold>
      {children}
    </Text>
  );
};
