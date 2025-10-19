import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    const isDevelopment = configService.get('NODE_ENV') === 'development';
    const isTest = configService.get('NODE_ENV') === 'test';

    // Priorité : DATABASE_URL (tests CI/CD) > NEON_DATABASE_URL_DEV > NEON_DATABASE_URL_PROD
    const databaseUrl: string | undefined =
      configService.get('DATABASE_URL') ||
      configService.get('NEON_DATABASE_URL_DEV') ||
      configService.get('NEON_DATABASE_URL_PROD');

    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: !isTest, // Pas de SSL pour PostgreSQL local en tests
      autoLoadEntities: true,
      synchronize: isDevelopment || isTest, // Auto-sync en dev et test
      logging: isDevelopment,
      retryAttempts: 3,
      retryDelay: 3000,
      migrations: ['dist/infrastructure/database/migrations/*.js'],
      migrationsRun: !isDevelopment && !isTest,
    };
  },
};
