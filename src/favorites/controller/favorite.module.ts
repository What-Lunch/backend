import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavoritesController } from './favorite.controller';
import { FavoritesService } from '../service/favorites.service';
import { UserFavorite, UserFavoriteSchema } from '../schemas/user-favorite.schema';
import { Token, TokenSchema } from '../../auth/schemas/token.schema';
import { Menu, MenuSchema } from '../../menus/schemas/menu.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserFavorite.name, schema: UserFavoriteSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Menu.name, schema: MenuSchema },
    ]),
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
