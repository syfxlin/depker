import { All, Controller, Param, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";

@Controller("/plugins")
export class PluginController {
  @All("/:name/:path")
  public async routes(@Param("name") name: string, @Req() request: Request, @Res() response: Response) {}
}
