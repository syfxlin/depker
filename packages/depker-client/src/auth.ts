import got from "got";
import ClientError from "./error/ClientError";
import ServerError from "./error/ServerError";

export type LoginProps = {
  endpoint: string;
  token: string;
};

type LoginResponse = {
  message: string;
  data?: { token: string };
};

export type ListTokenProps = {
  endpoint: string;
  token: string;
};

type ListTokenResponse = {
  message: string;
  data?: {
    tokens: {
      name: string;
      token: string;
    }[];
  };
};

export type AddTokenProps = {
  endpoint: string;
  token: string;
  name: string;
};

type AddTokenResponse = {
  message: string;
  data?: {
    name: string;
    token: string;
  };
};

export type DeleteTokenProps = {
  endpoint: string;
  token: string;
  name: string;
};

type DeleteTokenResponse = {
  message: string;
};

export const login = async ({ endpoint, token }: LoginProps) => {
  let body: LoginResponse;
  try {
    const response = await got.post<LoginResponse>(`${endpoint}/login`, {
      json: {
        token,
      },
      responseType: "json",
    });
    body = response.body;
  } catch (e) {
    throw new ServerError("Login error!", e);
  }
  if (!body || !body.data) {
    throw new ClientError("Login error!");
  }
  return body.data.token;
};

export const loginByToken = async ({ endpoint, token }: LoginProps) => {
  let body: LoginResponse;
  try {
    const response = await got.post<LoginResponse>(`${endpoint}/token`, {
      json: {
        token,
      },
      responseType: "json",
    });
    body = response.body;
  } catch (e) {
    throw new ServerError("Login error!", e);
  }
  if (!body || !body.data) {
    throw new ClientError("Login error!");
  }
  return body.data.token;
};

export const listToken = async ({ endpoint, token }: ListTokenProps) => {
  let body: ListTokenResponse;
  try {
    const response = await got.get<ListTokenResponse>(`${endpoint}/tokens`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      responseType: "json",
    });
    body = response.body;
  } catch (e) {
    throw new ServerError("List token error!", e);
  }
  if (!body || !body.data) {
    throw new ClientError("List token error!");
  }
  return body.data.tokens;
};

export const addToken = async ({ endpoint, token, name }: AddTokenProps) => {
  let body: AddTokenResponse;
  try {
    const response = await got.post<AddTokenResponse>(`${endpoint}/tokens`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      json: {
        name,
      },
      responseType: "json",
    });
    body = response.body;
  } catch (e) {
    throw new ServerError("Add token error!", e);
  }
  if (!body || !body.data) {
    throw new ClientError("Add token error!");
  }
  return body.data;
};

export const deleteToken = async ({
  endpoint,
  token,
  name,
}: DeleteTokenProps) => {
  try {
    await got.delete<DeleteTokenResponse>(`${endpoint}/tokens`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      json: {
        name,
      },
      responseType: "json",
    });
  } catch (e) {
    throw new ServerError("Delete token error!", e);
  }
};
