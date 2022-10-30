import React from "react";
import { useDeployLogs } from "../../api/use-deploy-logs";
import { Logs } from "../core/Logs";

export type DeployLogsProps = {
  id: string;
};

export const DeployLogs: React.FC<DeployLogsProps> = ({ id }) => {
  const logs = useDeployLogs(id);
  return <Logs title="Deploy Logs" empty={id ? "Loading..." : "Select a deploy to see the logs."} data={logs} />;
};
