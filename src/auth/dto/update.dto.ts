import { IsOptional, IsString } from 'class-validator';
import { IsPassword } from 'src/common/validators/password.validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsPassword()
  password?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
