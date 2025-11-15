import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateEventSeriesTable1731702000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'event_series',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'rrule',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'dtstart',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '50',
            default: "'Europe/Paris'",
            isNullable: false,
          },
          {
            name: 'exdates',
            type: 'timestamptz',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'rdates',
            type: 'timestamptz',
            isArray: true,
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
      'event_series',
      new TableForeignKey({
        name: 'FK_event_series_subscription',
        columnNames: ['subscription_id'],
        referencedTableName: 'subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'event_series',
      new TableIndex({
        name: 'IDX_event_series_subscription_id',
        columnNames: ['subscription_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'event_series',
      new TableIndex({
        name: 'IDX_event_series_dtstart',
        columnNames: ['dtstart'],
      }),
    );

    await queryRunner.createIndex(
      'event_series',
      new TableIndex({
        name: 'IDX_event_series_deleted_at',
        columnNames: ['deleted_at'],
        where: 'deleted_at IS NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('event_series', 'IDX_event_series_deleted_at');
    await queryRunner.dropIndex('event_series', 'IDX_event_series_dtstart');
    await queryRunner.dropIndex('event_series', 'IDX_event_series_subscription_id');

    // Drop foreign key
    await queryRunner.dropForeignKey('event_series', 'FK_event_series_subscription');

    // Drop table
    await queryRunner.dropTable('event_series');
  }
}
