import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { compareSync } from "bcrypt";
import { LoginRequest, LoginResponse } from "../views/auth.view";
import { Setting } from "../entities/setting.entity";
import { JwtStrategy } from "./jwt.strategy";

@Controller("/auth")
export class AuthController {
  constructor(private readonly jwts: JwtStrategy) {}

  @Post("/login")
  public async token(@Body() user: LoginRequest): Promise<LoginResponse> {
    const one = await Setting.read();
    if (user.username !== one.username || !compareSync(user.password, one.password)) {
      throw new UnauthorizedException("Username or password not match, try again.");
    }
    return {
      token: this.jwts.sign(user.username),
    };
  }
}
