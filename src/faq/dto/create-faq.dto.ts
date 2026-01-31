import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateFaqDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  message: string;
}
