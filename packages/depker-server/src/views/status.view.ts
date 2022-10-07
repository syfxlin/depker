import { IsArray, IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class AppStatusRequest {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Length(1, 128, { each: true })
  @Matches(/^[a-zA-Z0-9._-]+$/, { each: true })
  names: string[];
}

export type AppStatusResponse = Record<string, "stopped" | "running" | "restarting" | "exited">;
