import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export interface SecurityConfig {
  helmet: {
    enabled: boolean;
    contentSecurityPolicy: boolean;
    crossOriginResourcePolicy: string;
    crossOriginOpenerPolicy: string;
    crossOriginEmbedderPolicy: boolean;
    originAgentCluster: boolean;
    referrerPolicy: string;
    strictTransportSecurity: boolean;
    xContentTypeOptions: boolean;
    xDnsPrefetchControl: boolean;
    xDownloadOptions: boolean;
    xFrameOptions: string;
    xPermittedCrossDomainPolicies: boolean;
    xPoweredBy: boolean;
    xXssProtection: boolean;
  };
  trustProxy: boolean;
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
}

export const createSecurityConfig = (configService: ConfigService): SecurityConfig => {
  const environment = configService.get<string>('NODE_ENV', 'development');
  const isProd = environment === 'production';

  return {
    helmet: {
      enabled: configService.get<boolean>('SECURITY_HELMET_ENABLED', isProd),
      contentSecurityPolicy: configService.get<boolean>('SECURITY_CSP_ENABLED', isProd),
      crossOriginResourcePolicy: configService.get<string>('SECURITY_CORP', 'cross-origin'),
      crossOriginOpenerPolicy: configService.get<string>(
        'SECURITY_COOP',
        'same-origin-allow-popups',
      ),
      crossOriginEmbedderPolicy: configService.get<boolean>('SECURITY_COEP_ENABLED', false),
      originAgentCluster: configService.get<boolean>('SECURITY_OAC_ENABLED', true),
      referrerPolicy: configService.get<string>(
        'SECURITY_REFERRER_POLICY',
        'strict-origin-when-cross-origin',
      ),
      strictTransportSecurity: configService.get<boolean>('SECURITY_HSTS_ENABLED', isProd),
      xContentTypeOptions: configService.get<boolean>('SECURITY_XCTO_ENABLED', true),
      xDnsPrefetchControl: configService.get<boolean>('SECURITY_XDPC_ENABLED', true),
      xDownloadOptions: configService.get<boolean>('SECURITY_XDO_ENABLED', true),
      xFrameOptions: configService.get<string>('SECURITY_XFO', 'DENY'),
      xPermittedCrossDomainPolicies: configService.get<boolean>('SECURITY_XPCDP_ENABLED', false),
      xPoweredBy: configService.get<boolean>('SECURITY_XPB_ENABLED', false),
      xXssProtection: configService.get<boolean>('SECURITY_XXSS_ENABLED', true),
    },
    trustProxy: configService.get<boolean>('SECURITY_TRUST_PROXY', isProd),
    rateLimiting: {
      enabled: configService.get<boolean>('SECURITY_RATE_LIMITING_ENABLED', true),
      windowMs: configService.get<number>('SECURITY_RATE_LIMITING_WINDOW_MS', 15 * 60 * 1000),
      max: configService.get<number>('SECURITY_RATE_LIMITING_MAX', 100),
      skipSuccessfulRequests: configService.get<boolean>(
        'SECURITY_RATE_LIMITING_SKIP_SUCCESS',
        false,
      ),
      skipFailedRequests: configService.get<boolean>('SECURITY_RATE_LIMITING_SKIP_FAILED', false),
    },
  };
};

export const setupSecurity = (app: INestApplication, configService: ConfigService): void => {
  const securityConfig = createSecurityConfig(configService);

  if (securityConfig.helmet.enabled) {
    app.use(
      helmet({
        contentSecurityPolicy: securityConfig.helmet.contentSecurityPolicy
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                manifestSrc: ["'self'"],
                workerSrc: ["'self'"],
                childSrc: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                upgradeInsecureRequests: [],
              },
            }
          : false,
        crossOriginResourcePolicy: {
          policy: securityConfig.helmet.crossOriginResourcePolicy as any,
        },
        crossOriginOpenerPolicy: { policy: securityConfig.helmet.crossOriginOpenerPolicy as any },
        crossOriginEmbedderPolicy: securityConfig.helmet.crossOriginEmbedderPolicy,
        originAgentCluster: securityConfig.helmet.originAgentCluster,
        referrerPolicy: { policy: securityConfig.helmet.referrerPolicy as any },
        strictTransportSecurity: securityConfig.helmet.strictTransportSecurity
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
        xContentTypeOptions: securityConfig.helmet.xContentTypeOptions,
        xDnsPrefetchControl: { allow: !securityConfig.helmet.xDnsPrefetchControl },
        xDownloadOptions: securityConfig.helmet.xDownloadOptions,
        xFrameOptions: { action: securityConfig.helmet.xFrameOptions.toLowerCase() as any },
        xPermittedCrossDomainPolicies: securityConfig.helmet.xPermittedCrossDomainPolicies
          ? { permittedPolicies: 'none' }
          : false,
        xPoweredBy: securityConfig.helmet.xPoweredBy,
        xXssProtection: securityConfig.helmet.xXssProtection,
      }),
    );
  }

  if (securityConfig.trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }
};
