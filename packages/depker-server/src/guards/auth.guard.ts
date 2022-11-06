import { applyDecorators, CanActivate, ExecutionContext, Injectable, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request } from "express";

@Injectable()
export class AuthGuardDecorator implements CanActivate {
  constructor(private readonly auths: AuthService) {}

  public async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    try {
      if (authorization) {
        await this.auths.verify(authorization);
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }
}

export const AuthGuard = () => {
  return applyDecorators(UseGuards(AuthGuardDecorator));
};
