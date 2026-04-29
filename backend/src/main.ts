import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './swagger/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins?.length
      ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
          }
        }
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'boundary',
      'x-csrf-token',
    ],
    exposedHeaders: ['Content-Disposition'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Listening on 0.0.0.0:${port}`);
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
