import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MenusController } from './menus.controller';
import { MenusService } from '../service/menus.service';
import { Menu, MenuSchema } from '../schemas/menu.schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: Menu.name, schema: MenuSchema }])],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
