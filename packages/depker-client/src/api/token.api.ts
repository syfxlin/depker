import { Api } from "./client";
import {
  DeleteTokenRequest,
  DeleteTokenResponse,
  ListTokenRequest,
  ListTokenResponse,
  UpsertTokenRequest,
  UpsertTokenResponse,
} from "@syfxlin/depker-types";

export class TokenApi extends Api {
  public async list(request: ListTokenRequest) {
    const response = await this.client.client.get<ListTokenResponse>(`/api/tokens`, { params: request });
    return response.data;
  }

  public async create(request: UpsertTokenRequest) {
    const response = await this.client.client.post<UpsertTokenResponse>(`/api/tokens/${request.name}`);
    return response.data;
  }

  public async update(request: UpsertTokenRequest) {
    const response = await this.client.client.put<UpsertTokenResponse>(`/api/tokens/${request.name}`);
    return response.data;
  }

  public async delete(request: DeleteTokenRequest) {
    const response = await this.client.client.delete<DeleteTokenResponse>(`/api/tokens/${request.name}`);
    return response.data;
  }
}
