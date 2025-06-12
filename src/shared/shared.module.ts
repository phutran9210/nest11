import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentService, IdempotencyService } from './services';
import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([IdempotencyKeyEntity])],
  providers: [EnvironmentService, IdempotencyService],
  exports: [EnvironmentService, IdempotencyService],
})
export class SharedModule {}
