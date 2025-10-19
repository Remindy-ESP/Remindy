import { DataSource } from 'typeorm';
import { config } from 'dotenv';

const env = process.env.NODE_ENV || 'development';
const envFile: string | undefined =
  env === 'production' ? '.env.production' : env === 'staging' ? '.env.staging' : '.env.develop';
config({ path: envFile });
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL_DEV ||
  process.env.NEON_DATABASE_URL_STAGING ||
  process.env.NEON_DATABASE_URL_PROD;

const isTest = process.env.NODE_ENV === 'test';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: !isTest,
  entities: ['src/infrastructure/database/entities/*.entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
