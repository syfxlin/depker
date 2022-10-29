import React from "react";
import { Logs } from "../core/Logs";
import { useAccessLogs } from "../../api/use-access-logs";

export const AccessLogs: React.FC = () => {
  const query = useAccessLogs();
  return <Logs title="Access Logs" empty={!query.data && !query.error ? "Loading..." : "No logs."} data={query.data} />;
};
