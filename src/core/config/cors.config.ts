import { INestApplication } from '@nestjs/common';
import { CorsService } from './cors.service';

export { CorsService, CorsConfig } from './cors.service';

export const setupCors = (app: INestApplication, corsService: CorsService): void => {
  const corsOptions = corsService.createCorsOptions();
  app.enableCors(corsOptions);
};
