import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(__dirname, '../../core/entities/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, './migrations/**/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
