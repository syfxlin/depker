import { ConflictException, Controller, Delete, Get, NotFoundException, Post, Query } from "@nestjs/common";
import {
  CreateTokenRequest,
  CreateTokenResponse,
  DeleteTokenRequest,
  DeleteTokenResponse,
  ListTokenRequest,
  ListTokenResponse,
} from "../views/token.view";
import { Token } from "../entities/token.entity";
import { Like } from "typeorm";
import { Data } from "../decorators/data.decorator";
import { randomUUID } from "crypto";
import { AuthService } from "../guards/auth.service";

@Controller("/tokens")
export class TokenController {
  constructor(private readonly auths: AuthService) {}

  @Get("/")
  public async list(@Query() request: ListTokenRequest): Promise<ListTokenResponse> {
    const { search = "", offset = 0, limit = 10, sort = "name:asc" } = request;
    const [by, axis] = sort.split(":");
    const [tokens, count] = await Token.findAndCount({
      where: {
        name: search ? Like(`%${search}%`) : undefined,
        identity: search ? Like(`%${search}%`) : undefined,
      },
      order: {
        [by]: axis ? axis : "asc",
      },
      skip: offset,
      take: limit,
    });

    const total: ListTokenResponse["total"] = count;
    const items: ListTokenResponse["items"] = tokens.map((i) => ({
      name: i.name,
      identity: i.identity,
      createdAt: i.createdAt.getTime(),
      updatedAt: i.updatedAt.getTime(),
    }));

    return { total, items };
  }

  @Post("/")
  public async create(@Data() request: CreateTokenRequest): Promise<CreateTokenResponse> {
    const count = await Token.countBy({ name: request.name });
    if (count) {
      throw new ConflictException(`Found volume of ${request.name}.`);
    }
    const token = await Token.save({
      name: request.name,
      identity: randomUUID(),
    });
    const value = await this.auths.sign({
      type: "api",
      identity: token.identity,
    });
    return {
      name: token.name,
      identity: token.identity,
      token: value,
      createdAt: token.createdAt.getTime(),
      updatedAt: token.updatedAt.getTime(),
    };
  }

  @Delete("/:name")
  public async delete(@Data() request: DeleteTokenRequest): Promise<DeleteTokenResponse> {
    const count = await Token.countBy({ name: request.name });
    if (!count) {
      throw new NotFoundException(`Not found volume of ${request.name}.`);
    }

    await Token.delete(request.name);
    return { status: "success" };
  }
}
