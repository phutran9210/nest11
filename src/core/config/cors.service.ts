import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { CustomLoggerService } from '~core/logger/logger.service';

export interface CorsConfig {
  enabled: boolean;
  origin: boolean | string | RegExp | (string | RegExp)[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  exposedHeaders: string[];
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

@Injectable()
export class CorsService {
  private readonly configService: ConfigService;
  private readonly logger: CustomLoggerService;

  constructor(configService: ConfigService, logger: CustomLoggerService) {
    this.configService = configService;
    this.logger = logger;
  }

  createCorsOptions(): CorsOptions {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const corsEnabled = this.configService.get<boolean>('CORS_ENABLED', true);

    if (!corsEnabled) {
      this.logger.info('CORS is explicitly disabled via CORS_ENABLED=false', {
        corsEnabled,
        environment,
        component: 'CorsService',
      });
      return { origin: false };
    }

    const allowedOrigins = this.configService.get<string>('CORS_ALLOWED_ORIGINS', '');
    const allowedMethods = this.configService.get<string>(
      'CORS_ALLOWED_METHODS',
      'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    );
    const allowedHeaders = this.configService.get<string>(
      'CORS_ALLOWED_HEADERS',
      'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key,X-Request-ID,X-Correlation-ID',
    );
    const exposedHeaders = this.configService.get<string>(
      'CORS_EXPOSED_HEADERS',
      'X-Total-Count,X-Request-ID,X-Correlation-ID',
    );
    const credentials = this.configService.get<boolean>('CORS_CREDENTIALS', true);
    const maxAge = this.configService.get<number>('CORS_MAX_AGE', 86400);

    const origin = this.determineOrigin(environment, allowedOrigins);

    const corsOptions: CorsOptions = {
      origin,
      methods: this.parseCommaSeparatedString(allowedMethods),
      allowedHeaders: this.parseCommaSeparatedString(allowedHeaders),
      exposedHeaders: this.parseCommaSeparatedString(exposedHeaders),
      credentials,
      maxAge,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    this.logCorsConfiguration(environment, corsOptions);
    return corsOptions;
  }

  private determineOrigin(
    environment: string,
    allowedOrigins: string,
  ): boolean | string | RegExp | (string | RegExp)[] {
    if (environment === 'development') {
      this.logger.info('Development mode: Using predefined localhost origins', {
        environment,
        component: 'CorsService',
        originType: 'development-defaults',
      });
      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4200',
        'http://localhost:5173',
        'http://localhost:8080',
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      ];
    }

    if (allowedOrigins) {
      const origins = allowedOrigins.split(',').map((origin) => origin.trim());
      this.logger.info('Production mode: Using configured origins from CORS_ALLOWED_ORIGINS', {
        environment,
        component: 'CorsService',
        originType: 'configured',
        originsCount: origins.length,
        origins: origins,
      });
      return origins.map((originStr) => {
        if (originStr.startsWith('/') && originStr.endsWith('/')) {
          return new RegExp(originStr.slice(1, -1));
        }
        return originStr;
      });
    }

    this.logger.warn(
      '⚠️  CORS_ALLOWED_ORIGINS not configured in production. CORS is disabled for security. ' +
        'Set CORS_ALLOWED_ORIGINS environment variable to enable cross-origin requests.',
      'CorsService',
      {
        environment,
        component: 'CorsService',
        originType: 'disabled-for-security',
        recommendation: 'Set CORS_ALLOWED_ORIGINS environment variable',
      },
    );
    return false;
  }

  private parseCommaSeparatedString(value: string): string[] {
    return value.split(',').map((item) => item.trim());
  }

  private logCorsConfiguration(environment: string, corsOptions: CorsOptions): void {
    const originInfo = this.getOriginInfo(
      corsOptions.origin as boolean | string | RegExp | (string | RegExp)[],
    );

    this.logger.info(`CORS configured for ${environment} environment`, {
      environment,
      component: 'CorsService',
      originInfo,
      credentials: corsOptions.credentials,
      methods: Array.isArray(corsOptions.methods) ? corsOptions.methods : 'default',
      allowedHeaders: Array.isArray(corsOptions.allowedHeaders)
        ? corsOptions.allowedHeaders.length
        : 'default',
      exposedHeaders: Array.isArray(corsOptions.exposedHeaders)
        ? corsOptions.exposedHeaders.length
        : 'default',
      maxAge: corsOptions.maxAge,
      optionsSuccessStatus: corsOptions.optionsSuccessStatus,
    });

    if (corsOptions.credentials) {
      this.logger.info('CORS credentials enabled', {
        component: 'CorsService',
        securityNote: 'Credentials are allowed in cross-origin requests',
      });
    }

    if (Array.isArray(corsOptions.methods)) {
      this.logger.debug(`CORS methods configured`, 'CorsService', {
        component: 'CorsService',
        methods: corsOptions.methods,
        methodsCount: corsOptions.methods.length,
      });
    }
  }

  private getOriginInfo(origin: boolean | string | RegExp | (string | RegExp)[]): string {
    if (origin === false) {
      return 'CORS disabled (no origins allowed)';
    }
    if (origin === true) {
      return 'All origins allowed (⚠️ NOT RECOMMENDED for production)';
    }
    if (Array.isArray(origin)) {
      return `${origin.length} origins configured`;
    }
    if (typeof origin === 'string') {
      return `Single origin: ${origin}`;
    }
    return `Regex origin: ${origin.toString()}`;
  }

  getCorsConfigForTest(): CorsOptions {
    this.logger.info('Using test CORS configuration', {
      component: 'CorsService',
      configType: 'test',
      securityWarning: 'Test configuration allows all origins - not for production use',
    });
    return {
      origin: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      credentials: true,
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  validateOrigin(origin: string): boolean {
    const corsOptions = this.createCorsOptions();
    const isValid = this.performOriginValidation(corsOptions, origin);

    this.logger.debug('CORS origin validation performed', 'CorsService', {
      component: 'CorsService',
      origin,
      isValid,
      originType: this.getOriginType(
        corsOptions.origin as boolean | string | RegExp | (string | RegExp)[],
      ),
      action: 'validateOrigin',
    });

    return isValid;
  }

  private performOriginValidation(corsOptions: CorsOptions, origin: string): boolean {
    if (corsOptions.origin === false) {
      return false;
    }

    if (corsOptions.origin === true) {
      return true;
    }

    if (typeof corsOptions.origin === 'string') {
      return corsOptions.origin === origin;
    }

    if (corsOptions.origin instanceof RegExp) {
      return corsOptions.origin.test(origin);
    }

    if (Array.isArray(corsOptions.origin)) {
      return corsOptions.origin.some((allowedOrigin) => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        }
        return allowedOrigin.test(origin);
      });
    }

    return false;
  }

  private getOriginType(origin: boolean | string | RegExp | (string | RegExp)[]): string {
    if (origin === false) return 'disabled';
    if (origin === true) return 'all-allowed';
    if (typeof origin === 'string') return 'single-string';
    if (origin instanceof RegExp) return 'single-regex';
    if (Array.isArray(origin)) return 'multiple-origins';
    return 'unknown';
  }
}
