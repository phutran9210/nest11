import { Injectable } from '@nestjs/common';
import { RedisStringService } from '~core/redis/services';
import { CustomLoggerService } from '~core/logger/logger.service';

@Injectable()
export class JwtBlacklistService {
  private readonly redisService: RedisStringService;
  private readonly logger: CustomLoggerService;

  constructor(redisService: RedisStringService, logger: CustomLoggerService) {
    this.redisService = redisService;
    this.logger = logger;
  }

  async blacklistToken(jti: string, expiresIn: number): Promise<void> {
    const key = this.getBlacklistKey(jti);
    await this.redisService.set(key, 'blacklisted', expiresIn);
    this.logger.log(`Token blacklisted: ${jti}`, 'JwtBlacklistService');
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = this.getBlacklistKey(jti);
    const result = await this.redisService.get(key);
    return result !== null;
  }

  async blacklistRefreshToken(tokenId: string, expiresIn: number): Promise<void> {
    const key = this.getRefreshTokenKey(tokenId);
    await this.redisService.set(key, 'blacklisted', expiresIn);
    this.logger.log(`Refresh token blacklisted: ${tokenId}`, 'JwtBlacklistService');
  }

  async isRefreshTokenBlacklisted(tokenId: string): Promise<boolean> {
    const key = this.getRefreshTokenKey(tokenId);
    const result = await this.redisService.get(key);
    return result !== null;
  }

  async blacklistAllUserTokens(userId: string): Promise<void> {
    const key = this.getUserTokensKey(userId);
    const timestamp = Date.now().toString();
    await this.redisService.set(key, timestamp, 86400 * 30); // 30 days
    this.logger.log(`All tokens blacklisted for user: ${userId}`, 'JwtBlacklistService');
  }

  async isUserTokenValid(userId: string, issuedAt: number): Promise<boolean> {
    const key = this.getUserTokensKey(userId);
    const blacklistTimestamp = await this.redisService.get(key);

    if (!blacklistTimestamp) {
      return true;
    }

    const blacklistTime = parseInt(blacklistTimestamp, 10);
    return issuedAt * 1000 > blacklistTime;
  }

  private getBlacklistKey(jti: string): string {
    return `jwt:blacklist:${jti}`;
  }

  private getRefreshTokenKey(tokenId: string): string {
    return `refresh:blacklist:${tokenId}`;
  }

  private getUserTokensKey(userId: string): string {
    return `user:tokens:blacklist:${userId}`;
  }
}
