import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard as PassportGuard } from "@nestjs/passport";

export const AuthGuard = () => {
  return applyDecorators(UseGuards(PassportGuard("jwt")));
};
