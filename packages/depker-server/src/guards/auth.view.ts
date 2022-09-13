import { IsNotEmpty, IsString } from "class-validator";

export class AuthView {
  @IsString()
  @IsNotEmpty()
  token: string;
}
