import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:3000', 'https://whatlunch.vercel.app'],
    credentials: true,
  });

  // 검증 파이프
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const PORT = process.env.PORT || 3001;

  await app.listen(PORT);

  console.log(`
╔════════════════════════════════════════╗
║   🚀 What Lunch Backend 서버 시작     ║
║   🔗 http://localhost:${PORT}          ║
║   📡 WebSocket: ws://localhost:${PORT}/socket.io ║
╚════════════════════════════════════════╝
  `);
}

bootstrap();
