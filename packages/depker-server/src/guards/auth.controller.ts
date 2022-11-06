import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { compareSync } from "bcrypt";
import { LoginRequest, LoginResponse } from "../views/auth.view";
import { Setting } from "../entities/setting.entity";
import { AuthService } from "./auth.service";

@Controller("/auth")
export class AuthController {
  constructor(private readonly auths: AuthService) {}

  @Post("/login")
  public async token(@Body() user: LoginRequest): Promise<LoginResponse> {
    const one = await Setting.read();
    if (user.username !== one.username || !compareSync(user.password, one.password)) {
      throw new UnauthorizedException("Username or password not match, try again.");
    }
    const token = await this.auths.sign({ type: "web", identity: user.username });
    return { token };
  }
}
