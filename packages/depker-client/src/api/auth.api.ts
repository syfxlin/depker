import { Api } from "./client";
import { LoginRequest, LoginResponse } from "@syfxlin/depker-types";

export class AuthApi extends Api {
  public async login(request: LoginRequest) {
    const response = await this.request.post<LoginResponse>("/api/auth/login", request);
    return response.data.token;
  }
}
