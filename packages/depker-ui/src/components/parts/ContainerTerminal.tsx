import React from "react";
import { useContainerTerminal } from "../../api/use-container-terminal";
import { XTerm } from "../core/XTerm";

export type ContainerTerminalProps = {
  name: string;
};

export const ContainerTerminal: React.FC<ContainerTerminalProps> = ({ name }) => {
  const terminal = useContainerTerminal(name);
  return <XTerm client={terminal} />;
};
