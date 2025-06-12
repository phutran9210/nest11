import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum IdempotencyStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('idempotency_keys')
@Index(['operation', 'createdAt'])
export class IdempotencyKeyEntity {
  @PrimaryColumn('uuid')
  key: string;

  @Column({ type: 'varchar', length: 100 })
  operation: string;

  @Column({
    type: 'enum',
    enum: IdempotencyStatus,
    default: IdempotencyStatus.PROCESSING,
  })
  status: IdempotencyStatus;

  @Column({ type: 'jsonb', nullable: true })
  requestData: unknown;

  @Column({ type: 'jsonb', nullable: true })
  responseData: unknown;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  resultId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
