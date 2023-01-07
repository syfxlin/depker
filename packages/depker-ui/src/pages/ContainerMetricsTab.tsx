import React from "react";
import { useParams } from "react-router-dom";
import { Heading } from "../components/parts/Heading";
import { ContainerMetrics } from "../components/parts/ContainerMetrics";
import { Tab } from "../components/layout/Tab";

export const ContainerMetricsTab: React.FC = () => {
  const { container } = useParams<"container">();
  return (
    <Tab>
      <Heading>Container Metrics</Heading>
      <ContainerMetrics name={container!} />
    </Tab>
  );
};
