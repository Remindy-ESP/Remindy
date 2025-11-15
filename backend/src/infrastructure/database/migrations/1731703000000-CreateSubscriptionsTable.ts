import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSubscriptionsTable1731703000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'contract_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 19,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'EUR'",
            isNullable: false,
          },
          {
            name: 'frequency',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'next_due_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'trial_start_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'trial_end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        checks: [
          {
            name: 'chk_subscriptions_amount_positive',
            expression: 'amount > 0',
          },
          {
            name: 'chk_subscriptions_trial_dates',
            expression: 'trial_start_date IS NULL OR trial_end_date IS NULL OR trial_end_date > trial_start_date',
          },
          {
            name: 'chk_subscriptions_frequency',
            expression: "frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')",
          },
          {
            name: 'chk_subscriptions_status',
            expression: "status IN ('active', 'paused', 'cancelled', 'trial')",
          },
        ],
      }),
      true,
    );

    // Foreign key to users table (CASCADE on delete)
    await queryRunner.createForeignKey(
      'subscriptions',
      new TableForeignKey({
        name: 'fk_subscriptions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key to contracts table (SET NULL on delete)
    await queryRunner.createForeignKey(
      'subscriptions',
      new TableForeignKey({
        name: 'fk_subscriptions_contract',
        columnNames: ['contract_id'],
        referencedTableName: 'contracts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Unique composite index on (user_id, LOWER(name)) WHERE deleted_at IS NULL
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_subscriptions_user_name
      ON subscriptions(user_id, LOWER(name))
      WHERE deleted_at IS NULL
    `);

    // Regular indexes
    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_contract_id',
        columnNames: ['contract_id'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_next_due_date',
        columnNames: ['next_due_date'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_start_date',
        columnNames: ['start_date'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'idx_subscriptions_frequency',
        columnNames: ['frequency'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_frequency');
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_deleted_at');
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_created_at');
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_start_date');
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_next_due_date');
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_status');
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_contract_id');
    await queryRunner.dropIndex('subscriptions', 'idx_subscriptions_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS uq_subscriptions_user_name');

    // Drop foreign keys
    await queryRunner.dropForeignKey('subscriptions', 'fk_subscriptions_contract');
    await queryRunner.dropForeignKey('subscriptions', 'fk_subscriptions_user');

    // Drop table
    await queryRunner.dropTable('subscriptions');
  }
}
