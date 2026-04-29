import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { AdminModule } from '../modules/admin/admin.module';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API Documentation — Remindy')
    .setDescription("Documentation de l'API Remindy")
    .setVersion('v1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const adminConfig = new DocumentBuilder()
    .setTitle('Remindy Admin API')
    .setDescription('Endpoints /admin/*')
    .setVersion('v1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addCookieAuth('csrfToken', { type: 'apiKey', in: 'cookie' }, 'admin-csrf-cookie')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-csrf-token' }, 'admin-csrf-header')
    .build();

  const adminDocument = SwaggerModule.createDocument(app, adminConfig, {
    include: [AdminModule],
  });

  type SwaggerRequest = { headers?: Record<string, string> };
  SwaggerModule.setup('api/admin', app, adminDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      requestInterceptor: (req: SwaggerRequest): SwaggerRequest => {
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
}
