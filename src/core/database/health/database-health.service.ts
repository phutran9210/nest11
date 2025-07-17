import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

interface IPostgresConnectionOptions {
  database?: string
  host?: string
  port?: number
}

export interface IDatabaseHealthStatus {
  status: 'healthy' | 'unhealthy'
  isConnected: boolean
  responseTime: number
  error?: string
  details: {
    database: string
    host: string
    port: number
    connectionCount?: number
  }
}

@Injectable()
export class DatabaseHealthService {
  private readonly dataSource: DataSource

  constructor(@InjectDataSource() dataSource: DataSource) {
    this.dataSource = dataSource
  }

  private getConnectionOptions(): IPostgresConnectionOptions {
    return this.dataSource.options as IPostgresConnectionOptions
  }

  async checkHealth(): Promise<IDatabaseHealthStatus> {
    const startTime = Date.now()

    try {
      // Check if connection is established
      if (!this.dataSource.isInitialized) {
        throw new Error('Database connection not initialized')
      }

      // Simple query to test connection
      await this.dataSource.query('SELECT 1')

      const responseTime = Date.now() - startTime
      const connectionCount = await this._getConnectionCount()

      return {
        status: 'healthy',
        isConnected: true,
        responseTime,
        details: {
          database: this.getConnectionOptions().database || 'unknown',
          host: this.getConnectionOptions().host || 'unknown',
          port: this.getConnectionOptions().port || 0,
          connectionCount,
        },
      }
    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        status: 'unhealthy',
        isConnected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          database: this.getConnectionOptions().database || 'unknown',
          host: this.getConnectionOptions().host || 'unknown',
          port: this.getConnectionOptions().port || 0,
        },
      }
    }
  }

  private async _getConnectionCount(): Promise<number | undefined> {
    try {
      // PostgreSQL query to get connection count

      const result: Array<{ count: string }> = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM pg_stat_activity WHERE datname = $1`,
        [this.getConnectionOptions().database],
      )

      return parseInt(result[0]?.count || '0', 10)
    } catch {
      return undefined
    }
  }

  async isHealthy(): Promise<boolean> {
    const health = await this.checkHealth()
    return health.status === 'healthy'
  }
}
