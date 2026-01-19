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
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000', // 백엔드 포트
        'http://localhost:3001', // 프론트 포트 (추후 삭제)
        'http://localhost:3002', // 추후 삭제
        'https://whatlunch.vercel.app',
      ];

      if (
        !origin ||
        (typeof origin === 'string' &&
          (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT ?? 3001; // 추후에 3000으로 변경 예정
  await app.listen(port);
}
void bootstrap();
