import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateIdempotencyKeyTable1749710470233 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "idempotency_status_enum" AS ENUM('processing', 'completed', 'failed')
    `)

    await queryRunner.query(`
      CREATE TABLE "idempotency_keys" (
        "key" uuid NOT NULL,
        "operation" character varying(100) NOT NULL,
        "status" "idempotency_status_enum" NOT NULL DEFAULT 'processing',
        "requestData" jsonb,
        "responseData" jsonb,
        "errorMessage" character varying(500),
        "resultId" character varying(36),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_idempotency_keys" PRIMARY KEY ("key")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_idempotency_keys_operation_createdAt" ON "idempotency_keys" ("operation", "createdAt")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_idempotency_keys_operation_createdAt"`)
    await queryRunner.query(`DROP TABLE "idempotency_keys"`)
    await queryRunner.query(`DROP TYPE "idempotency_status_enum"`)
  }
}
