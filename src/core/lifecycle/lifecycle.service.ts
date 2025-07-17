import {
  type BeforeApplicationShutdown,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common'

@Injectable()
export class LifecycleService implements OnModuleDestroy, BeforeApplicationShutdown {
  private readonly logger = new Logger(LifecycleService.name)
  private shutdownInProgress = false

  beforeApplicationShutdown(signal?: string) {
    if (this.shutdownInProgress) return

    this.shutdownInProgress = true
    this.logger.log(`🔄 Application shutdown initiated${signal ? ` by signal: ${signal}` : ''}`)
  }

  async onModuleDestroy() {
    if (!this.shutdownInProgress) {
      this.beforeApplicationShutdown()
    }

    this.logger.log('🔄 Starting graceful shutdown sequence...')

    // Add any custom cleanup logic here
    await this.performCustomCleanup()

    this.logger.log('✅ Lifecycle service cleanup completed')
  }

  private async performCustomCleanup(): Promise<void> {
    try {
      // Add any application-specific cleanup tasks here

      // Example: Clear intervals, timeouts, etc.
      this.clearAllIntervals()

      // Example: Flush any pending operations
      await this.flushPendingOperations()

      this.logger.log('✅ Custom cleanup tasks completed')
    } catch (error) {
      this.logger.error('❌ Error during custom cleanup:', error)
    }
  }

  private clearAllIntervals(): void {
    // Clear any global intervals if needed
    // This is just an example - implement based on your needs
  }

  private async flushPendingOperations(): Promise<void> {
    // Flush any pending async operations
    // This is just an example - implement based on your needs
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Utility method to check if shutdown is in progress
  isShuttingDown(): boolean {
    return this.shutdownInProgress
  }
}
