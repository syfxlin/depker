import { DepkerClient } from "@syfxlin/depker-client";
import { token } from "./token";
import { history } from "../router/history";

export const client = new DepkerClient({
  endpoint: "http://localhost:3000",
  token: () => token.get(),
});

client.client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      token.set(null);
      history.push("/login");
    }
    return Promise.reject(error);
  }
);

export const logout = async () => {
  token.set(null);
  history.push("/");
};
