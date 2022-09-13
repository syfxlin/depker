import { IsNotEmpty, Length } from "class-validator";

export class LoginView {
  @IsNotEmpty()
  @Length(1, 128)
  username: string;

  @IsNotEmpty()
  @Length(8, 128)
  password: string;
}
