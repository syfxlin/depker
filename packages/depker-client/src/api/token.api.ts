import { Api } from "./client";
import {
  CreateTokenRequest,
  CreateTokenResponse,
  DeleteTokenRequest,
  DeleteTokenResponse,
  ListTokenRequest,
  ListTokenResponse,
} from "@syfxlin/depker-types";

export class TokenApi extends Api {
  public async list(request: ListTokenRequest) {
    const response = await this.request.get<ListTokenResponse>(`/api/tokens`, { params: request });
    return response.data;
  }

  public async create(request: CreateTokenRequest) {
    const response = await this.request.post<CreateTokenResponse>(`/api/tokens`, request);
    return response.data;
  }

  public async delete(request: DeleteTokenRequest) {
    const response = await this.request.delete<DeleteTokenResponse>(`/api/tokens/${request.name}`);
    return response.data;
  }
}
