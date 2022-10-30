import React, { ReactNode } from "react";
import { useIntervalUpdate } from "../../hooks/use-interval-update";

export type TimeRefreshProps = {
  interval: number;
  children: () => ReactNode;
};

export const TimeRefresh: React.FC<TimeRefreshProps> = (props) => {
  useIntervalUpdate(props.interval);
  return <>{props.children()}</>;
};
