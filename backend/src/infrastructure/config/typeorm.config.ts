import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env.production' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.NEON_DATABASE_URL_PROD,
  ssl: true,
  entities: ['src/infrastructure/database/entities/*.entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
