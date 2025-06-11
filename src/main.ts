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

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;

  // Retry logic for port binding
  let retries = 3;
  while (retries > 0) {
    try {
      await app.listen(port);
      break;
    } catch (error: unknown) {
      const errorCode =
        error instanceof Error && 'code' in error ? (error as { code: string }).code : undefined;
      if (errorCode === 'EADDRINUSE' && retries > 1) {
        console.log(`⚠️ Port ${port} is busy, killing process and retrying...`);

        // Kill process using the port
        try {
          const childProcess = await import('child_process');
          childProcess.execSync(`fuser -k ${port}/tcp || true`, { stdio: 'ignore' });
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          retries--;
          continue;
        } catch {
          console.log('Could not kill process, trying next retry...');
        }
      }
      throw error;
    }
  }

  // Graceful shutdown handling
  const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'] as const;

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);

    try {
      // Close NestJS application (this will trigger all OnModuleDestroy hooks)
      await app.close();
      console.log('✅ Application closed successfully');

      // Force close any remaining connections
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  signals.forEach((signal) => {
    process.on(signal, () => void gracefulShutdown(signal));
  });

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    void gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    void gracefulShutdown('unhandledRejection');
  });

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log('💡 Press Ctrl+C to stop the server');
}

void bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
