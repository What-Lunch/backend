import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MenusController } from './menus.controller';
import { MenusService } from '../service/menus.service';
import { Menu, MenuSchema } from '../schemas/menu.schemas';
import { RouletteResultSchema } from '../schemas/menu-result.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Menu.name, schema: MenuSchema },
      { name: 'RouletteResult', schema: RouletteResultSchema },
    ]),
  ],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
