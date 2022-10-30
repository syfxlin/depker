import React from "react";
import { Logs } from "../core/Logs";
import { useAccessLogs } from "../../api/use-access-logs";

export const AccessLogs: React.FC = () => {
  const { data, loading } = useAccessLogs();
  return <Logs title="Access Logs" empty={loading ? "Loading..." : "No logs."} data={data} />;
};
