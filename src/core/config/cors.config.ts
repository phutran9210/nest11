import type { INestApplication } from '@nestjs/common'
import type { CorsService } from './cors.service'

export { CorsConfig, CorsService } from './cors.service'

export const setupCors = (app: INestApplication, corsService: CorsService): void => {
  const corsOptions = corsService.createCorsOptions()
  app.enableCors(corsOptions)
}
