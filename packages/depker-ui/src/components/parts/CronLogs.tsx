import React from "react";
import { useCronLogs } from "../../api/use-cron-logs";
import { Logs } from "../core/Logs";

export type CronLogsProps = {
  service: string;
  id: string;
};

export const CronLogs: React.FC<CronLogsProps> = ({ service, id }) => {
  const logs = useCronLogs(service, id);
  return <Logs title="Cron Logs" empty={logs.empty} data={logs.data} />;
};
