import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { getDatabaseConfig } from './src/core/config/database.config';

// Load environment variables
config();

const configService = new ConfigService();
const dbConfig = getDatabaseConfig(configService);

export const AppDataSource = new DataSource({
  ...dbConfig,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/core/database/migrations/*{.ts,.js}'],
  subscribers: ['src/subscribers/*{.ts,.js}'],
} as DataSourceOptions);
