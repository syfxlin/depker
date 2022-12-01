import React from "react";
import { useDeployLogs } from "../../api/use-deploy-logs";
import { Logs } from "../core/Logs";

export type DeployLogsProps = {
  service: string;
  id: string;
};

export const DeployLogs: React.FC<DeployLogsProps> = ({ service, id }) => {
  const logs = useDeployLogs(service, id);
  return <Logs title="Deploy Logs" empty={logs.empty} data={logs.data} />;
};
