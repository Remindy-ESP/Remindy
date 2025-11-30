import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
    )

  const config = swaggerConfigBuilder.build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config as OpenAPIObject);

  SwaggerModule.setup('swagger/v1', app, document);

  await app.listen(3000);
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
