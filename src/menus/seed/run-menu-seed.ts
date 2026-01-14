import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Menu } from '../schemas/menu.schemas';
import { menuSeedData } from './menu.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const menuModel = app.get<Model<Menu>>(getModelToken(Menu.name));

  await menuModel.deleteMany({});
  await menuModel.insertMany(menuSeedData);

  console.log('✔️ Menu seed data inserted');

  await app.close();
}

void bootstrap();
