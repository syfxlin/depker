import React from "react";
import { Text, TextProps } from "ink";

export const Space: React.FC<TextProps & { count?: number }> = ({
  children,
  count = 1,
  ...props
}) => {
  return <Text {...props}>{children ?? " ".repeat(count)}</Text>;
};
