import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from '../../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from '../service/auth.service';
import { Token, TokenSchema } from '../schemas/token.schema';

@Module({
  imports: [UsersModule, MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
