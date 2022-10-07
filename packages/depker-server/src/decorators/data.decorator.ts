import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const Data = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return {
    ...(request.params ?? {}),
    ...(request.query ?? {}),
    ...(request.body ?? {}),
    ...(request.headers ?? {}),
  };
});
