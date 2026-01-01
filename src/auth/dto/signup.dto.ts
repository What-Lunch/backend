import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsPassword } from 'src/common/validators/password.validator';
import { Match } from '../decorators/match.decorator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsPassword()
  password: string;

  @IsPassword()
  @Match('password', { message: 'Passwords do not match' })
  passwordConfirm: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nickname: string;
}
