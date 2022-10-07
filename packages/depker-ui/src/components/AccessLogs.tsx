import React from "react";
import { Logs } from "./Logs";
import { useAccessLogs } from "../api/use-access-logs";

export const AccessLogs: React.FC = () => {
  const query = useAccessLogs();
  return <Logs title="Access Logs" index={1} data={query.data ?? []} />;
};
