import React from "react";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { ContainerTerminal } from "../components/parts/ContainerTerminal";
import { Tab } from "../components/layout/Tab";

export const ServiceTerminalTab: React.FC = () => {
  const { service } = useParams<"service">();
  return (
    <Tab>
      <Heading>Service Terminal</Heading>
      <ContainerTerminal name={service!} />
    </Tab>
  );
};
