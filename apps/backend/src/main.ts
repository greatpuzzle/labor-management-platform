import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // bodyParser를 false로 설정하고 직접 관리
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Express 인스턴스에 접근하여 body size limit 증가
  const expressApp = app.getHttpAdapter().getInstance();
  const express = require('express');
  const path = require('path');
  
  // 정적 파일 서빙 (uploads 폴더)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  expressApp.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      // CORS 헤더 설정
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // 이미지 파일의 경우 적절한 Content-Type 설정
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }
    }
  }));
  
  // body parser를 직접 설정 (50MB 제한)
  expressApp.use(express.json({ limit: '50mb' }));
  expressApp.use(express.urlencoded({ limit: '50mb', extended: true }));
  expressApp.use(express.raw({ limit: '50mb' }));
  expressApp.use(express.text({ limit: '50mb' }));
  
  // 계약서 서명 엔드포인트에 대한 타임아웃 증가
  expressApp.use((req, res, next) => {
    if (req.url?.includes('/contracts/sign')) {
      req.setTimeout(60000); // 60초 타임아웃
      res.setTimeout(60000);
    }
    next();
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 설정
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.45.78:5173',
    'http://192.168.45.78:5174',
    'http://192.168.45.187:5173',
    'http://192.168.45.187:5174',
    // 배포 환경
    'http://43.200.44.109:3000',
    'http://43.200.44.109:3001',
  ];
  
  const corsOrigin = process.env.CORS_ORIGIN
    ? [...defaultOrigins, ...process.env.CORS_ORIGIN.split(',')]
    : defaultOrigins;

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
  // 네트워크에서 접근 가능하도록 0.0.0.0으로 바인딩
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend server is running on http://localhost:${port}`);
  console.log(`🌐 Backend server is accessible from network at http://192.168.45.78:${port}`);
}
bootstrap();
