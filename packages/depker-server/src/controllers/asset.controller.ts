import { Controller, Get, Header, NotFoundException, Param } from "@nestjs/common";
import * as icons from "simple-icons/icons";
import { SimpleIcon } from "simple-icons";

@Controller("/api")
export class AssetController {
  @Get("/icons/:name")
  @Header("content-type", "image/svg+xml")
  public async icons(@Param("name") name: string) {
    const key = `si${name.substring(0, 1).toUpperCase() + name.substring(1)}`;
    const icon = (icons as Record<string, SimpleIcon>)[key];
    if (!icon) {
      throw new NotFoundException(`Icon ${name} not found.`);
    }
    return `
      <svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24" fill="#${icon.hex}">
        <title>${icon.title}</title>
        <path d="${icon.path}" />
      </svg>
    `;
  }
}
