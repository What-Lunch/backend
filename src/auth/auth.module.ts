import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from '../users/users.module';
import { AuthController } from '../auth/controller/auth.controller';
import { AuthService } from '../auth/service/auth.service';
import { Token, TokenSchema } from '../auth/schemas/token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
