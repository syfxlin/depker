import { DepkerClient } from "@syfxlin/depker-client";
import { token } from "./token";
import { history } from "../router/history";

export const client = new DepkerClient({
  endpoint: "http://localhost:3000",
  token: () => token.get(),
});

client.request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

export const login = (value: string) => {
  token.set(value);
  history.push("/");
};

export const logout = () => {
  token.set(null);
  history.push("/login");
};
