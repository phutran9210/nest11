import { Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisPubSubService {
  private readonly logger = new Logger(RedisPubSubService.name)
  private readonly client: Redis | null

  constructor(client: Redis | null) {
    this.client = client
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping publish operation')
      return 0
    }
    try {
      return await this.client.publish(channel, message)
    } catch (error) {
      this.logger.error(`Error publishing to channel ${channel}:`, error)
      throw error
    }
  }

  async subscribe(...channels: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping subscribe operation')
      return 0
    }
    try {
      const result = await this.client.subscribe(...channels)
      return result as number
    } catch (error) {
      this.logger.error(`Error subscribing to channels:`, error)
      throw error
    }
  }

  async unsubscribe(...channels: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping unsubscribe operation')
      return 0
    }
    try {
      const result = await this.client.unsubscribe(...channels)
      return result as number
    } catch (error) {
      this.logger.error(`Error unsubscribing from channels:`, error)
      throw error
    }
  }

  async psubscribe(...patterns: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping psubscribe operation')
      return 0
    }
    try {
      const result = await this.client.psubscribe(...patterns)
      return result as number
    } catch (error) {
      this.logger.error(`Error pattern subscribing:`, error)
      throw error
    }
  }

  async punsubscribe(...patterns: string[]): Promise<number> {
    if (!this.client) {
      this.logger.warn('Redis client not available, skipping punsubscribe operation')
      return 0
    }
    try {
      const result = await this.client.punsubscribe(...patterns)
      return result as number
    } catch (error) {
      this.logger.error(`Error pattern unsubscribing:`, error)
      throw error
    }
  }

  // Event handlers for pub/sub
  onMessage(callback: (channel: string, message: string) => void): void {
    if (!this.client) {
      this.logger.warn('Redis client not available, cannot set message handler')
      return
    }
    this.client.on('message', callback)
  }

  onPatternMessage(callback: (pattern: string, channel: string, message: string) => void): void {
    if (!this.client) {
      this.logger.warn('Redis client not available, cannot set pattern message handler')
      return
    }
    this.client.on('pmessage', callback)
  }

  onSubscribe(callback: (channel: string, count: number) => void): void {
    if (!this.client) {
      this.logger.warn('Redis client not available, cannot set subscribe handler')
      return
    }
    this.client.on('subscribe', callback)
  }

  onUnsubscribe(callback: (channel: string, count: number) => void): void {
    if (!this.client) {
      this.logger.warn('Redis client not available, cannot set unsubscribe handler')
      return
    }
    this.client.on('unsubscribe', callback)
  }

  onPatternSubscribe(callback: (pattern: string, count: number) => void): void {
    if (!this.client) {
      this.logger.warn('Redis client not available, cannot set pattern subscribe handler')
      return
    }
    this.client.on('psubscribe', callback)
  }

  onPatternUnsubscribe(callback: (pattern: string, count: number) => void): void {
    if (!this.client) {
      this.logger.warn('Redis client not available, cannot set pattern unsubscribe handler')
      return
    }
    this.client.on('punsubscribe', callback)
  }

  // Utility method to create a separate subscriber client
  createSubscriber(): Redis | null {
    if (!this.client) {
      this.logger.warn('Redis client not available, cannot create subscriber')
      return null
    }
    try {
      // Create a duplicate connection for subscription
      return this.client.duplicate()
    } catch (error) {
      this.logger.error('Error creating subscriber client:', error)
      return null
    }
  }
}
