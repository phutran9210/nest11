import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateUserTableMigration1640000000000 implements MigrationInterface {
  name = 'CreateUserTable1640000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    )

    // Create indexes for better performance
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_EMAIL',
        columnNames: ['email'],
      }),
    )

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_IS_ACTIVE',
        columnNames: ['is_active'],
      }),
    )

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_CREATED_AT',
        columnNames: ['created_at'],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_USER_CREATED_AT')
    await queryRunner.dropIndex('users', 'IDX_USER_IS_ACTIVE')
    await queryRunner.dropIndex('users', 'IDX_USER_EMAIL')
    await queryRunner.dropTable('users')
  }
}
