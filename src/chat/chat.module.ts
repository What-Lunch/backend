import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';
import { RoomsController } from './controller/rooms.controller';

@Module({
  imports: [AuthModule],
  controllers: [RoomsController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
