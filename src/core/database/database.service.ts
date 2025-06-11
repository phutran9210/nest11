import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly dataSource: DataSource;

  constructor(@InjectDataSource() dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async onModuleDestroy() {
    if (this.dataSource && this.dataSource.isInitialized) {
      try {
        this.logger.log('🔄 Closing database connection...');

        // Close all connections with timeout
        await Promise.race([
          this.dataSource.destroy(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database close timeout')), 5000),
          ),
        ]);

        this.logger.log('✅ Database connection closed gracefully');
      } catch (error) {
        this.logger.error('❌ Error closing database connection:', error);

        // Force close if graceful close fails
        try {
          if (this.dataSource.isInitialized) {
            await this.dataSource.destroy();
          }
        } catch (forceError) {
          this.logger.error('❌ Error force closing database:', forceError);
        }
      }
    }
  }

  beforeApplicationShutdown(signal?: string) {
    this.logger.log(`🔄 Database service received shutdown signal: ${signal || 'unknown'}`);
  }

  async isConnected(): Promise<boolean> {
    return Promise.resolve(this.dataSource?.isInitialized || false);
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
