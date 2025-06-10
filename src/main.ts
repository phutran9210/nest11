import { NestFactory } from '@nestjs/core';
import { AppModule } from '~/app.module';
import { validationPipeConfig } from '~/core/config/validation.config';
import { setupSwagger } from '~/core/config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Pipes for validation
  app.useGlobalPipes(validationPipeConfig);

  // Setup Swagger for API documentation
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
