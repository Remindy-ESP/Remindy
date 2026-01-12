import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  // Enable CORS for mobile app
  const isProduction = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProduction
      ? [
          process.env.FRONTEND_URL || 'https://yourdomain.com',
          'exp://*', // For Expo Go in development
          /^http:\/\/localhost:\d+$/, // Local development
        ]
      : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'boundary', // For multipart/form-data uploads
    ],
    exposedHeaders: ['Content-Disposition'], // For file downloads
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfigBuilder = new DocumentBuilder()
    .setTitle('API Documentation for Remindy')
    .setDescription('Documentation de l’API')
    .setVersion('v1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    );

  const config = swaggerConfigBuilder.build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config as OpenAPIObject);

  SwaggerModule.setup('api', app, document);

  const port: number = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
