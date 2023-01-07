import React from "react";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { ContainerMetrics } from "../components/parts/ContainerMetrics";
import { Tab } from "../components/layout/Tab";

export const ServiceMetricsTab: React.FC = () => {
  const { service } = useParams<"service">();
  return (
    <Tab>
      <Heading>Service Metrics</Heading>
      <ContainerMetrics name={service!} />
    </Tab>
  );
};
