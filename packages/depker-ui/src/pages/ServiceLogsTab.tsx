import React from "react";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { ContainerLogs } from "../components/parts/ContainerLogs";
import { Tab } from "../components/layout/Tab";

export const ServiceLogsTab: React.FC = () => {
  const { service } = useParams<"service">();
  return (
    <Tab>
      <Heading>Service Logs</Heading>
      <ContainerLogs name={service!} />
    </Tab>
  );
};
