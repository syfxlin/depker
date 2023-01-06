import { Api } from "./client";
import {
  CreateImageRequest,
  CreateImageResponse,
  DeleteImageRequest,
  DeleteImageResponse,
  ListImageRequest,
  ListImageResponse,
} from "@syfxlin/depker-types";

export class ImageApi extends Api {
  public async list(request: ListImageRequest) {
    const response = await this.client.client.get<ListImageResponse>(`/api/images`, { params: request });
    return response.data;
  }

  public async create(request: CreateImageRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.post<CreateImageResponse>(`/api/images/${name}`);
    return response.data;
  }

  public async delete(request: DeleteImageRequest) {
    const name = encodeURIComponent(request.name);
    const response = await this.client.client.delete<DeleteImageResponse>(`/api/images/${name}`, {
      params: request,
    });
    return response.data;
  }
}
