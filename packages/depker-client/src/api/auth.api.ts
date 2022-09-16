import { Api } from "./client";
import { LoginRequest, LoginResponse } from "@syfxlin/depker-types";

export class AuthApi extends Api {
  public async login(data: LoginRequest) {
    const response = await this.client.post<LoginResponse>("/api/auth/login", data);
    return response.data.token;
  }
}
