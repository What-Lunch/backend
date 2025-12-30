import { applyDecorators } from '@nestjs/common';

import { IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';

export function IsPassword() {
  return applyDecorators(
    IsString(),
    IsNotEmpty(),
    MinLength(8),
    MaxLength(20),
    Matches(/^(?=.*[\W_])(?!.*\s).+$/, {
      message: '비밀번호는 8~20자이며 특수문자를 최소 1개 포함해야 합니다.',
    }),
  );
}
