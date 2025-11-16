import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    const nodeEnv: string | undefined = configService.get('NODE_ENV') || 'development';
    const isDevelopment: boolean = nodeEnv === 'development';
    const isTest: boolean = nodeEnv === 'test';
    const isStaging: boolean = nodeEnv === 'staging';
    const isProduction: boolean = nodeEnv === 'production';
    const databaseUrl: string | undefined =
      configService.get('DATABASE_URL') ||
      configService.get('NEON_DATABASE_URL_DEV') ||
      configService.get('NEON_DATABASE_URL_STAGING') ||
      configService.get('NEON_DATABASE_URL_PROD');

    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: !isTest,
      autoLoadEntities: true,
      synchronize: false, // Disabled - use migrations only
      logging: isDevelopment,
      retryAttempts: 3,
      retryDelay: 3000,
      migrations: ['dist/infrastructure/database/migrations/*.js'],
      migrationsRun: false, // Migrations should be run manually
    };
  },
};
