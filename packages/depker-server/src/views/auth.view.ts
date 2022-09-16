import { IsNotEmpty, Length } from "class-validator";

export class LoginRequest {
  @IsNotEmpty()
  @Length(1, 128)
  username: string;

  @IsNotEmpty()
  @Length(8, 128)
  password: string;
}

export type LoginResponse = {
  token: string;
};
