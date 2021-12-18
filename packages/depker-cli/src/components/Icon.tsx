import React from "react";
import { Text, TextProps } from "ink";

export const Icon: React.FC<TextProps> = ({ children, ...props }) => {
  return (
    <Text bold {...props}>
      {children}{" "}
    </Text>
  );
};
