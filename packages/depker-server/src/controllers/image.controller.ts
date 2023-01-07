import { Controller, Delete, Get, Post } from "@nestjs/common";
import { Data } from "../decorators/data.decorator";
import {
  CreateImageRequest,
  CreateImageResponse,
  DeleteImageRequest,
  DeleteImageResponse,
  ListImageRequest,
  ListImageResponse,
} from "../views/image.view";
import { DockerService } from "../services/docker.service";
import { AuthGuard } from "../guards/auth.guard";

@Controller("/api/images")
export class ImageController {
  constructor(private readonly docker: DockerService) {}

  @Get("/")
  @AuthGuard()
  public async list(@Data() request: ListImageRequest): Promise<ListImageResponse> {
    const { search = "", offset = 0, limit = 10, sort = "id:asc" } = request;
    const [infos, containers] = await Promise.all([this.docker.images.list(), this.docker.containers.list()]);

    const filtered = infos.filter((i) => {
      const lower = search.toLowerCase();
      if (!lower) {
        return true;
      }
      const fields = [i.Id, ...(i.RepoTags ?? [])];
      return fields.find((f) => f.toLowerCase().indexOf(lower) !== -1);
    });

    const total: ListImageResponse["total"] = filtered.length;
    const items: ListImageResponse["items"] = filtered
      .sort((left, right) => {
        const [by, order] = sort.toLowerCase().split(":");
        const a = order === "asc" ? left : right;
        const b = order === "asc" ? right : left;
        if (by === "id") {
          return a.Id.localeCompare(b.Id);
        }
        if (by === "tags") {
          return (a.RepoTags ?? []).length - (b.RepoTags ?? []).length;
        }
        if (by === "created") {
          return a.Created - b.Created;
        }
        if (by === "size") {
          return a.Size - b.Size;
        }
        return 0;
      })
      .slice(offset, offset + limit)
      .map((i) => ({
        id: i.Id,
        tags: i.RepoTags ?? [],
        created: i.Created * 1000,
        size: i.Size,
        containers: containers
          .filter((c) => c.ImageID === i.Id)
          .map((c) => ({
            id: c.Id,
            name: this.docker.containers._names(c.Names),
            image: c.Image,
          })),
      }));

    return { total, items };
  }

  @Post("/:name")
  @AuthGuard()
  public async create(@Data() request: CreateImageRequest): Promise<CreateImageResponse> {
    await this.docker.images.pull(request.name, true);
    return { status: "success" };
  }

  @Delete("/:name")
  @AuthGuard()
  public async delete(@Data() request: DeleteImageRequest): Promise<DeleteImageResponse> {
    await this.docker.images.remove(request.name);
    return { status: "success" };
  }
}
