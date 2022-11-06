import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AUTH_SECRET } from "../constants/depker.constant";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configs: ConfigService, private readonly jwts: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configs.get(AUTH_SECRET),
    });
  }

  public validate(payload: any) {
    const user = payload.user;
    if (!user) {
      throw new UnauthorizedException(`401 Unauthorized`);
    }
    return { user };
  }

  public sign(user: string) {
    return this.jwts.sign({ user });
  }

  public verify(token: string, user?: string) {
    const payload = this.jwts.verify(token, { secret: this.configs.get(AUTH_SECRET) });
    const result = this.validate(payload);
    if (result.user !== user) {
      throw new UnauthorizedException(`401 Unauthorized`);
    }
    return result;
  }
}
