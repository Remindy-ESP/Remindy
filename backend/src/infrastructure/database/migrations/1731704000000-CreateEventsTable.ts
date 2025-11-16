import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEventsTable1731704000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'subscription_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_series_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'title',
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
            name: 'starts_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'ends_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'scheduled'",
            isNullable: false,
          },
          {
            name: 'payment_status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create foreign key to subscriptions table
    await queryRunner.createForeignKey(
      'events',
      new TableForeignKey({
        name: 'fk_events_subscription',
        columnNames: ['subscription_id'],
        referencedTableName: 'subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('events', 'fk_events_subscription');

    // Drop table
    await queryRunner.dropTable('events');
  }
}
