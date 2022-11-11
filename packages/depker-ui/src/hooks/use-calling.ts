import { ReactNode, useCallback, useState } from "react";
import { NotificationProps, showNotification } from "@mantine/notifications";

export const error = (e: Error | ReactNode) => {
  if (!(e instanceof Error)) {
    return e;
  }
  const data = (e as any)?.response?.data;
  if (typeof data?.message === "string") {
    return data.message;
  }
  if (data?.message instanceof Array) {
    return data.message.join(", ");
  }
  return e.message;
};

export type UseCallingActions = {
  success: (title: ReactNode, message?: ReactNode, props?: Partial<NotificationProps>) => void;
  failure: (title: ReactNode, message?: ReactNode | Error, props?: Partial<NotificationProps>) => void;
  loading: (value: boolean) => void;
};

export const useCalling = () => {
  const [loading, setLoading] = useState(false);

  const calling = useCallback(async <T>(fn: (actions: UseCallingActions) => Promise<T>): Promise<T> => {
    const actions: UseCallingActions = {
      loading: setLoading,
      success: (title, message, props) => {
        showNotification({
          title: title,
          message: message,
          color: "green",
          ...props,
        });
      },
      failure: (title, message, props) => {
        showNotification({
          title: title,
          message: error(message),
          color: "red",
          ...props,
        });
      },
    };
    try {
      actions.loading(true);
      return await fn(actions);
    } finally {
      actions.loading(false);
    }
  }, []);

  return { loading, calling, update: setLoading };
};
