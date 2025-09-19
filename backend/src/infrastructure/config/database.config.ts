import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isDevelopment = configService.get('NODE_ENV') === 'development';

        return {
            type: 'postgres',
            url: configService.get('NEON_DATABASE_URL_PROD'),
            ssl: true,
            autoLoadEntities: true,
            synchronize: isDevelopment,
            logging: isDevelopment,
            retryAttempts: 3,
            retryDelay: 3000,
            migrations: ['dist/infrastructure/database/migrations/*.js'],
            migrationsRun: !isDevelopment
        };
    },
};