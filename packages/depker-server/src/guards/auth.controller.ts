import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { compareSync } from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { LoginRequest, LoginResponse } from "../views/auth.view";
import { Setting } from "../entities/setting.entity";

@Controller("/auth")
export class AuthController {
  constructor(private readonly jwts: JwtService) {}

  @Post("/login")
  public async token(@Body() user: LoginRequest): Promise<LoginResponse> {
    const one = await Setting.read();
    if (user.username !== one.username || !compareSync(user.password, one.password)) {
      throw new UnauthorizedException("Username or password not match, try again.");
    }
    return {
      token: this.jwts.sign({ user: user.username }),
    };
  }
}
