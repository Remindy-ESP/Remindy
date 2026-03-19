import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAdminSecurityTables1700000000000 implements MigrationInterface {
  name = 'CreateAdminSecurityTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'security_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'eventType', type: 'varchar', length: '80' },
          { name: 'severity', type: 'varchar', length: '20', default: "'info'" },
          { name: 'userId', type: 'uuid', isNullable: true },
          { name: 'userEmail', type: 'varchar', length: '255', isNullable: true },
          { name: 'ipAddress', type: 'varchar', length: '45', isNullable: true },
          { name: 'userAgent', type: 'text', isNullable: true },
          { name: 'resource', type: 'varchar', length: '255', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'isSuspicious', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    for (const col of [
      'eventType',
      'severity',
      'ipAddress',
      'userId',
      'isSuspicious',
      'createdAt',
    ]) {
      await queryRunner.createIndex('security_logs', new TableIndex({ columnNames: [col] }));
    }

    await queryRunner.createTable(
      new Table({
        name: 'blocked_ips',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'ipAddress', type: 'varchar', length: '45', isUnique: true },
          { name: 'reason', type: 'varchar', length: '40' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'blockedUntil', type: 'timestamptz', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'blockedBy', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    for (const col of ['isActive', 'blockedUntil']) {
      await queryRunner.createIndex('blocked_ips', new TableIndex({ columnNames: [col] }));
    }

    await queryRunner.createTable(
      new Table({
        name: 'security_policy',
        columns: [
          { name: 'id', type: 'varchar', length: '20', isPrimary: true },
          { name: 'maxLoginAttempts', type: 'int', default: 5 },
          { name: 'lockoutDurationMinutes', type: 'int', default: 15 },
          { name: 'sessionTimeoutMinutes', type: 'int', default: 60 },
          { name: 'requireMfaForAdmin', type: 'boolean', default: true },
          { name: 'minPasswordLength', type: 'int', default: 8 },
          { name: 'requireUppercase', type: 'boolean', default: true },
          { name: 'requireNumbers', type: 'boolean', default: true },
          { name: 'requireSpecialChars', type: 'boolean', default: true },
          { name: 'passwordExpiryDays', type: 'int', default: 90 },
          { name: 'rateLimitPerMinute', type: 'int', default: 100 },
          { name: 'autoBlockAfterRequests', type: 'int', default: 20 },
          { name: 'autoBlockDurationMinutes', type: 'int', default: 60 },
          { name: 'allowedOrigins', type: 'text', default: "''" },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `INSERT INTO security_policy (id) VALUES ('global') ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('security_policy', true);
    await queryRunner.dropTable('blocked_ips', true);
    await queryRunner.dropTable('security_logs', true);
  }
}
