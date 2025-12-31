import { IsEmail } from 'class-validator';
import { IsPassword } from 'src/common/validators/password.validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsPassword()
  password!: string;
}
