import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './controller/chat.controller';
import { RoomsController } from './controller/rooms.controller';
import { AuthModule } from '../auth/auth.module';
import { MenusModule } from 'src/menus/controller/menus.module';

@Module({
  imports: [AuthModule, MenusModule],
  controllers: [RoomsController, ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
