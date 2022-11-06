import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Setting } from "../entities/setting.entity";
import { Token } from "../entities/token.entity";

export type TokenPayload = {
  type: "web" | "api";
  identity: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwts: JwtService) {}

  public async sign(payload: TokenPayload) {
    return this.jwts.sign(payload, { expiresIn: payload.type === "web" ? "1d" : undefined });
  }

  public async verify(token: string, identity?: string) {
    const payload = this.jwts.verify(token) as TokenPayload;
    if (payload.type === "web") {
      const entity = await Setting.read();
      if (entity.username !== payload.identity) {
        throw new UnauthorizedException(`401 Unauthorized`);
      }
      if (payload.identity !== identity) {
        throw new UnauthorizedException(`401 Unauthorized`);
      }
    } else {
      const entity = await Token.findOneBy({ token: payload.identity });
      if (!entity) {
        throw new UnauthorizedException(`401 Unauthorized`);
      }
      if (payload.identity !== identity) {
        throw new UnauthorizedException(`401 Unauthorized`);
      }
    }
    return payload;
  }
}
