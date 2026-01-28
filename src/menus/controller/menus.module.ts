import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MenusController } from './menus.controller';
import { MenusService } from '../service/menus.service';
import { Menu, MenuSchema } from '../schemas/menu.schemas';
import { RouletteResultSchema, RouletteResult } from '../schemas/menu-result.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Menu.name, schema: MenuSchema },
      { name: RouletteResult.name, schema: RouletteResultSchema },
    ]),
  ],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
