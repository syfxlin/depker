import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AUTH_SECRET } from "../constants/depker.constant";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configs: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configs.get(AUTH_SECRET),
    });
  }

  async validate(payload: any) {
    const logged = payload.logged;
    if (!logged) {
      throw new UnauthorizedException();
    }
    return { logged };
  }
}
