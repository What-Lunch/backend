import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './controller/chat.controller';
import { RoomsController } from './controller/rooms.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RoomsController, ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
