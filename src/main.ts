import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성 제거
      forbidNonWhitelisted: true, // DTO에 없는 속성 → 에러
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
void bootstrap();
