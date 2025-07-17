import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '~/app.module'
import { CorsService, setupCors, setupSecurity } from '~/core/config'
import { setupSwagger } from '~/core/config/swagger.config'
import { validationPipeConfig } from '~/core/config/validation.config'

async function killPortProcess(port: number): Promise<void> {
  try {
    const childProcess = await import('node:child_process')
    childProcess.execSync(`fuser -k ${port}/tcp || true`, { stdio: 'ignore' })
    await new Promise((resolve) => setTimeout(resolve, 1000))
  } catch {
    console.log('Could not kill process, trying next retry...')
  }
}

async function listenWithRetry(app: INestApplication, port: number, maxRetries = 3): Promise<void> {
  let retries = maxRetries
  while (retries > 0) {
    try {
      await app.listen(port)
      return
    } catch (error: unknown) {
      const errorCode =
        error instanceof Error && 'code' in error ? (error as { code: string }).code : undefined
      if (errorCode === 'EADDRINUSE' && retries > 1) {
        console.log(`⚠️ Port ${port} is busy, killing process and retrying...`)
        await killPortProcess(port)
        retries--
        continue
      }
      throw error
    }
  }
}

function setupGracefulShutdown(app: INestApplication): void {
  const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'] as const

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`)
    try {
      await app.close()
      console.log('✅ Application closed successfully')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }

  signals.forEach((signal) => {
    process.on(signal, () => void gracefulShutdown(signal))
  })

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    void gracefulShutdown('uncaughtException')
  })

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason)
    void gracefulShutdown('unhandledRejection')
  })
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const corsService = app.get(CorsService)

  setupSecurity(app, configService)
  setupCors(app, corsService)

  app.useGlobalPipes(validationPipeConfig)
  setupSwagger(app)
  app.enableShutdownHooks()

  const port: number = Number(process.env.PORT) || 3000

  await listenWithRetry(app, port)

  setupGracefulShutdown(app)

  console.log(`🚀 Application is running on: http://localhost:${port}`)
}

void bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error)
  process.exit(1)
})
