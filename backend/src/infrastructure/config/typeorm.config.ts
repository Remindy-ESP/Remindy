import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env.develop' });

// Priorité : DATABASE_URL (tests CI/CD) > NEON_DATABASE_URL_DEV > NEON_DATABASE_URL_PROD
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL_DEV ||
  process.env.NEON_DATABASE_URL_PROD;

const isTest = process.env.NODE_ENV === 'test';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: !isTest, // Pas de SSL pour PostgreSQL local en tests
  entities: ['src/infrastructure/database/entities/*.entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
