import React from "react";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { ContainerTerminal } from "../components/parts/ContainerTerminal";
import { Tab } from "../components/layout/Tab";

export const ContainerTerminalTab: React.FC = () => {
  const { container } = useParams<"container">();
  return (
    <Tab>
      <Heading>Container Terminal</Heading>
      <ContainerTerminal name={container!} />
    </Tab>
  );
};
