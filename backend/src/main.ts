import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { AdminModule } from './modules/admin/admin.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  // Enable CORS for mobile app development
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'boundary', // For multipart/form-data uploads
      'x-csrf-token', 
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

  const adminConfig = new DocumentBuilder()
    .setTitle('Remindy Admin API')
    .setDescription('Endpoints /admin/*')
    .setVersion('v1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addCookieAuth('csrfToken', { type: 'apiKey', in: 'cookie' }, 'admin-csrf-cookie')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-csrf-token' }, 'admin-csrf-header')
    .build();

  const adminDocument: OpenAPIObject = SwaggerModule.createDocument(
    app,
    adminConfig as OpenAPIObject,
    { include: [AdminModule] },
  );

  SwaggerModule.setup('api/admin', app, adminDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      requestInterceptor: (req: any) => {
        const doc = (globalThis as any).document;
        const cookieStr: string = doc?.cookie ?? '';
        const match = cookieStr.match(/(?:^|;\s*)csrfToken=([^;]+)/);
        if (match?.[1]) {
          req.headers = req.headers || {};
          req.headers['x-csrf-token'] = decodeURIComponent(match[1]);
        }
        return req;
      },
    },
  });
  await app.listen(3000, '0.0.0.0');
  console.log(`Listening on URL ${await app.getUrl()}`);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
