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
    const logged = payload.logged;
    if (!logged) {
      throw new UnauthorizedException();
    }
    return { logged };
  }

  public $validate(token: string) {
    const payload = this.jwts.verify(token, {
      secret: this.configs.get(AUTH_SECRET),
    });
    return this.validate(payload);
  }
}
