import { IsNotEmpty, IsString, Length } from "class-validator";

export class LoginRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 128)
  password: string;
}

export type LoginResponse = {
  token: string;
};
