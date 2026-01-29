import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FavoritesController } from './favorite.controller';
import { FavoritesService } from '../service/favorites.service';
import { UserFavorite, UserFavoriteSchema } from '../schemas/user-favorite.schema';

import { MenusModule } from '../../menus/controller/menus.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserFavorite.name, schema: UserFavoriteSchema }]),
    MenusModule,
    AuthModule,
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
