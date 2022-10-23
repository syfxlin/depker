import { AxiosError } from "axios";

export const error = (e: AxiosError) => {
  const data = e.response?.data as any;
  if (typeof data?.message === "string") {
    return data.message;
  }
  if (data?.message instanceof Array) {
    return data.message.join(", ");
  }
  return e.message;
};
