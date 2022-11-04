import React from "react";
import { useDeployLogs } from "../../api/use-deploy-logs";
import { Logs } from "../core/Logs";

export type DeployLogsProps = {
  app: string;
  id: string;
};

export const DeployLogs: React.FC<DeployLogsProps> = ({ app, id }) => {
  const logs = useDeployLogs(app, id);
  return <Logs title="Deploy Logs" empty={logs.empty} data={logs.data} />;
};
