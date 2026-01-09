import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 설정
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://192.168.45.187:5173',
    'http://192.168.45.187:5174',
  ];

  console.log('🔐 CORS allowed origins:', corsOrigin);

  app.enableCors({
    origin: (origin, callback) => {
      console.log('📨 CORS request from origin:', origin);
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigin.includes(origin)) {
        console.log('✅ CORS allowed for:', origin);
        return callback(null, true);
      }

      console.log('❌ CORS blocked for:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend server is running on http://localhost:${port}`);
}
bootstrap();
