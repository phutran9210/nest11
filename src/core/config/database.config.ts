import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'

export interface IDatabaseConfig {
  type: 'postgres'
  host: string
  port: number
  username: string
  password: string
  database: string
  synchronize: boolean
  logging: boolean | 'all' | Array<'query' | 'error' | 'schema' | 'warn' | 'info' | 'log'>
  ssl: boolean | { rejectUnauthorized: boolean }
  entities: string[]
  migrations: string[]
  migrationsRun: boolean
  dropSchema: boolean
  maxQueryExecutionTime: number
  extra: {
    max: number
    min: number
    acquire: number
    idle: number
  }
}

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development')
  const isProduction = nodeEnv === 'production'
  const isTest = nodeEnv === 'test'

  // SAFETY: Always use explicit false defaults to prevent data loss

  const config: IDatabaseConfig = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'password'),
    database: configService.get<string>('DB_NAME', isTest ? 'test_db' : 'mydb'),

    // Schema management - SAFEGUARDS: Never drop or auto-sync in development
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false), // Always false unless explicitly set
    migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', false), // Never auto-run migrations
    dropSchema: configService.get<boolean>('DB_DROP_SCHEMA', false), // Never drop schema unless explicitly set

    // Entities and migrations - Will be overridden in DatabaseModule for explicit imports
    entities: [],
    migrations: [],

    // Logging
    logging: configService.get<boolean>('DB_LOGGING', !isProduction)
      ? ['error', 'warn', 'schema', 'log']
      : false,

    // SSL Configuration
    ssl: isProduction
      ? { rejectUnauthorized: configService.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED', false) }
      : false,

    // Performance settings
    maxQueryExecutionTime: configService.get<number>('DB_MAX_QUERY_EXECUTION_TIME', 10000),

    // Connection pool settings
    extra: {
      max: configService.get<number>('DB_POOL_MAX', 20),
      min: configService.get<number>('DB_POOL_MIN', 2),
      acquire: configService.get<number>('DB_POOL_ACQUIRE', 60000),
      idle: configService.get<number>('DB_POOL_IDLE', 10000),
    },
  }

  // Validate required environment variables in production
  if (isProduction) {
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME']
    const missingVars = requiredVars.filter((varName) => !configService.get(varName))

    if (missingVars.length > 0) {
      throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`)
    }
  }

  return config
}
