import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface AppConfig {
  port: number
  nodeEnv: string
  apiPrefix: string
}

export interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  synchronize: boolean
  logging: boolean
}

export interface SecurityConfig {
  saltRounds: number
  jwtSecret: string
  jwtExpiresIn: string
  corsOrigin: string[]
}

export interface LoggingConfig {
  level: string
  dir: string
  enableFileLogging: boolean
}

export interface RateLimitConfig {
  loginIp: {
    maxAttempts: number
    windowMs: number
    blockDurationMs: number
  }
  loginUser: {
    maxAttempts: number
    windowMs: number
    blockDurationMs: number
  }
  api: {
    maxAttempts: number
    windowMs: number
    blockDurationMs: number
  }
}

export interface EnvironmentVariables {
  app: AppConfig
  database: DatabaseConfig
  security: SecurityConfig
  logging: LoggingConfig
  rateLimit: RateLimitConfig
}

@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService) {}

  get app(): AppConfig {
    return {
      port: parseInt(this.configService.get<string>('PORT', '3000'), 10),
      nodeEnv: this.configService.get<string>('NODE_ENV', 'development'),
      apiPrefix: this.configService.get<string>('API_PREFIX', 'api'),
    }
  }

  get database(): DatabaseConfig {
    return {
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: parseInt(this.configService.get<string>('DB_PORT', '5432'), 10),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'password'),
      database: this.configService.get<string>('DB_NAME', 'nestjs_db'),
      synchronize: this.configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
      logging: this.configService.get<string>('DB_LOGGING', 'false') === 'true',
    }
  }

  get security(): SecurityConfig {
    return {
      saltRounds: parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10),
      jwtSecret: this.configService.get<string>('JWT_SECRET', 'your-secret-key'),
      jwtExpiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      corsOrigin: this.configService
        .get<string>('CORS_ORIGIN', 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim()),
    }
  }

  get logging(): LoggingConfig {
    return {
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      dir: this.configService.get<string>('LOG_DIR', 'logs'),
      enableFileLogging: this.configService.get<string>('ENABLE_FILE_LOGGING', 'true') === 'true',
    }
  }

  get rateLimit(): RateLimitConfig {
    return {
      loginIp: {
        maxAttempts: parseInt(
          this.configService.get<string>('RATE_LIMIT_LOGIN_IP_MAX_ATTEMPTS', '5'),
          10,
        ),
        windowMs: parseInt(
          this.configService.get<string>('RATE_LIMIT_LOGIN_IP_WINDOW_MS', '900000'),
          10,
        ),
        blockDurationMs: parseInt(
          this.configService.get<string>('RATE_LIMIT_LOGIN_IP_BLOCK_DURATION_MS', '1800000'),
          10,
        ),
      },
      loginUser: {
        maxAttempts: parseInt(
          this.configService.get<string>('RATE_LIMIT_LOGIN_USER_MAX_ATTEMPTS', '3'),
          10,
        ),
        windowMs: parseInt(
          this.configService.get<string>('RATE_LIMIT_LOGIN_USER_WINDOW_MS', '900000'),
          10,
        ),
        blockDurationMs: parseInt(
          this.configService.get<string>('RATE_LIMIT_LOGIN_USER_BLOCK_DURATION_MS', '3600000'),
          10,
        ),
      },
      api: {
        maxAttempts: parseInt(
          this.configService.get<string>('RATE_LIMIT_API_MAX_ATTEMPTS', '100'),
          10,
        ),
        windowMs: parseInt(
          this.configService.get<string>('RATE_LIMIT_API_WINDOW_MS', '900000'),
          10,
        ),
        blockDurationMs: parseInt(
          this.configService.get<string>('RATE_LIMIT_API_BLOCK_DURATION_MS', '1800000'),
          10,
        ),
      },
    }
  }

  get all(): EnvironmentVariables {
    return {
      app: this.app,
      database: this.database,
      security: this.security,
      logging: this.logging,
      rateLimit: this.rateLimit,
    }
  }

  isDevelopment(): boolean {
    return this.app.nodeEnv === 'development'
  }

  isProduction(): boolean {
    return this.app.nodeEnv === 'production'
  }

  isTest(): boolean {
    return this.app.nodeEnv === 'test'
  }

  getRequiredString(key: string): string {
    const value = this.configService.get<string>(key)
    if (!value) {
      throw new Error(`Required environment variable ${key} is not defined`)
    }
    return value
  }

  getRequiredNumber(key: string): number {
    const value = this.configService.get<number>(key)
    if (value === undefined || value === null) {
      throw new Error(`Required environment variable ${key} is not defined`)
    }
    return value
  }

  validateRequiredVars(): void {
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME']

    const missingVars = requiredVars.filter((varName) => !this.configService.get(varName))

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }
  }
}
