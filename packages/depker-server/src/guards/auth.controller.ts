import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { compareSync } from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { LoginView } from "../views/login.view";
import { SettingService } from "../services/setting.service";

@Controller("/api/v1/auth")
export class AuthController {
  constructor(private readonly settingService: SettingService, private readonly jwtService: JwtService) {}

  @Post("/login")
  public async token(@Body() user: LoginView) {
    const one = await this.settingService.get();
    if (user.username !== one.username || !compareSync(user.password, one.password)) {
      throw new UnauthorizedException("用户名或密码错误");
    }
    return {
      token: this.jwtService.sign({ logged: true }),
    };
  }
}
