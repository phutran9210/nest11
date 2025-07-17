import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { IdempotencyKeyEntity, IdempotencyStatus } from '~shared/entities/idempotency-key.entity'

export interface IdempotencyResult<T = Record<string, unknown>> {
  isExisting: boolean
  data?: T
  status: IdempotencyStatus
}

@Injectable()
export class IdempotencyService {
  private readonly idempotencyRepository: Repository<IdempotencyKeyEntity>

  constructor(
    @InjectRepository(IdempotencyKeyEntity)
    idempotencyRepository: Repository<IdempotencyKeyEntity>,
  ) {
    this.idempotencyRepository = idempotencyRepository
  }

  async checkOrCreateIdempotencyKey<T = Record<string, unknown>>(
    key: string,
    operation: string,
    requestData: Record<string, unknown>,
  ): Promise<IdempotencyResult<T>> {
    const existingKey = await this.idempotencyRepository.findOne({
      where: { key, operation },
    })

    if (existingKey) {
      if (existingKey.status === IdempotencyStatus.PROCESSING) {
        throw new ConflictException(
          'Request is already being processed. Please wait or retry with a different idempotency key.',
        )
      }

      return {
        isExisting: true,
        data: existingKey.responseData as T,
        status: existingKey.status,
      }
    }

    await this.idempotencyRepository.save({
      key,
      operation,
      status: IdempotencyStatus.PROCESSING,
      requestData,
      responseData: null,
      errorMessage: '',
      resultId: '',
    })

    return {
      isExisting: false,
      status: IdempotencyStatus.PROCESSING,
    }
  }

  async updateIdempotencyKey(
    key: string,
    operation: string,
    status: IdempotencyStatus,
    responseData?: Record<string, unknown>,
    errorMessage?: string,
    resultId?: string,
  ): Promise<void> {
    await this.idempotencyRepository.update(
      { key, operation },
      {
        status,
        responseData: responseData,
        errorMessage,
        resultId,
        updatedAt: new Date(),
      },
    )
  }

  async cleanupExpiredKeys(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await this.idempotencyRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute()

    return result.affected || 0
  }
}
