import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class AddFoodDotDto {
  @IsString()
  @IsNotEmpty({ message: 'dotId는 필수 값입니다.' })
  @Length(1, 50, { message: 'dotId는 1~50자여야 합니다.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'dotId는 영문, 숫자, -, _ 만 허용됩니다.',
  })
  dotId: string;
}
