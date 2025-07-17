import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IdempotencyKeyEntity } from './entities/idempotency-key.entity'
import { EnvironmentService, IdempotencyService } from './services'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyKeyEntity])],
  providers: [EnvironmentService, IdempotencyService],
  exports: [EnvironmentService, IdempotencyService],
})
export class SharedModule {}
