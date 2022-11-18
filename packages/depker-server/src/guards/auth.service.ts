import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";
import { Request } from "express";

export type TokenPayload = {
  type: "web" | "api";
  identity: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwts: JwtService) {}

  public async sign(payload: TokenPayload) {
    return this.jwts.sign(payload, payload.type === "web" ? { expiresIn: "1d" } : undefined);
  }

  public async verify(token?: string, user?: string) {
    if (!token) {
      throw new UnauthorizedException(`401 Unauthorized`);
    }
    const payload = this.jwts.verify(token) as TokenPayload;
    if (payload.type === "web") {
      const entity = await Setting.read();
      if (entity.username !== payload.identity) {
        throw new UnauthorizedException(`401 Unauthorized`);
      }
      if (user) {
        if (entity.username !== user) {
          throw new UnauthorizedException(`401 Unauthorized`);
        }
      }
    } else {
      const entity = await Token.findOneBy({ identity: payload.identity });
      if (!entity) {
        throw new UnauthorizedException(`401 Unauthorized`);
      }
      if (user) {
        const entity = await Setting.read();
        if (entity.username !== user) {
          throw new UnauthorizedException(`401 Unauthorized`);
        }
      }
    }
    return payload;
  }

  public async request(request: Request) {
    const authorization: string = request.headers["authorization"] ?? request.cookies["depker-token"];
    try {
      if (authorization) {
        if (authorization.startsWith("Basic ")) {
          const strings = Buffer.from(authorization.replace("Basic ", ""), "base64").toString("utf-8").split(":");
          const username = strings.shift();
          const password = strings.join(":");
          return await this.verify(password, username);
        } else {
          const token = authorization.replace("Bearer ", "");
          return await this.verify(token);
        }
      }
    } catch (e) {
      // ignore
    }
    throw new UnauthorizedException(`401 Unauthorized`);
  }
}
