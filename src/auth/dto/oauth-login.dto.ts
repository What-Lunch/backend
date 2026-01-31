import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleOAuthLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
