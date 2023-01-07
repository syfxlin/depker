import { client } from "./client";
import { useEffect, useState } from "react";
import { MetricsContainerData } from "@syfxlin/depker-client";
import { error } from "../hooks/use-calling";
import { showNotification } from "@mantine/notifications";

export const useContainerMetrics = (name: string) => {
  const [metrics, setMetrics] = useState<MetricsContainerData["data"] | null>(null);

  useEffect(() => {
    setMetrics(null);
    const socket = client.containers.metrics({ name });

    socket.on("data", (data: MetricsContainerData["data"]) => {
      setMetrics(data);
    });
    socket.on("error", (err) => {
      showNotification({
        title: "Metrics error",
        message: error(err),
        color: "red",
      });
    });
    socket.on("connect_error", (err) => {
      showNotification({
        title: "Metrics connect error",
        message: error(err),
        color: "red",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [name]);

  return metrics;
};
