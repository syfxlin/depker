import React from "react";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { ContainerLogs } from "../components/parts/ContainerLogs";
import { Tab } from "../components/layout/Tab";

export const ContainerLogsTab: React.FC = () => {
  const { container } = useParams<"container">();
  return (
    <Tab>
      <Heading>Container Logs</Heading>
      <ContainerLogs name={container!} />
    </Tab>
  );
};
