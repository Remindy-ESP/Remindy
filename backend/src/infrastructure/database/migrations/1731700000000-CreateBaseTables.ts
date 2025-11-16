import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBaseTables1731700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table first (no dependencies)
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'key',
            type: 'text',
            isPrimary: true,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create contracts table (no dependencies)
    await queryRunner.createTable(
      new Table({
        name: 'contracts',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'description',
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
        ],
      }),
      true,
    );

    // Create users table (depends on roles)
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'photo_r2_key',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'role_key',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
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
            name: 'language',
            type: 'varchar',
            length: '10',
            default: "'fr'",
            isNullable: false,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'mfa_enabled',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'mfa_secret',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'failed_login_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'password_changed_at',
            type: 'timestamptz',
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

    // Foreign key users -> roles
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        name: 'FK_users_role',
        columnNames: ['role_key'],
        referencedTableName: 'roles',
        referencedColumnNames: ['key'],
        onDelete: 'RESTRICT',
      }),
    );

    // Create indexes for users
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_role',
        columnNames: ['role_key'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_last_login',
        columnNames: ['last_login_at'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_failed_login',
        columnNames: ['failed_login_count'],
      }),
    );

    // Create user_preferences table
    await queryRunner.createTable(
      new Table({
        name: 'user_preferences',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'theme',
            type: 'varchar',
            length: '20',
            default: "'light'",
            isNullable: false,
          },
          {
            name: 'notification_email',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'notification_push',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'notification_sms',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'default_reminder_delay',
            type: 'integer',
            default: 24,
            isNullable: false,
          },
          {
            name: 'show_online_status',
            type: 'boolean',
            default: true,
            isNullable: false,
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
        ],
        checks: [
          {
            name: 'CHK_default_reminder_delay_positive',
            expression: 'default_reminder_delay > 0',
          },
        ],
      }),
      true,
    );

    // Foreign key user_preferences -> users
    await queryRunner.createForeignKey(
      'user_preferences',
      new TableForeignKey({
        name: 'FK_user_preferences_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create user_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
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
            name: 'refresh_token_hash',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
            isNullable: false,
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

    // Foreign key user_sessions -> users
    await queryRunner.createForeignKey(
      'user_sessions',
      new TableForeignKey({
        name: 'FK_user_sessions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for user_sessions
    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'idx_user_sessions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'idx_user_sessions_refresh_token_hash',
        columnNames: ['refresh_token_hash'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'idx_user_sessions_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'idx_user_sessions_is_revoked',
        columnNames: ['is_revoked'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'idx_user_sessions_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    // Create role_limits table
    await queryRunner.createTable(
      new Table({
        name: 'role_limits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'role_key',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'resource',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'max_count',
            type: 'integer',
            isNullable: false,
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
        ],
        checks: [
          {
            name: 'CHK_max_count_positive',
            expression: 'max_count > 0',
          },
        ],
      }),
      true,
    );

    // Foreign key role_limits -> roles
    await queryRunner.createForeignKey(
      'role_limits',
      new TableForeignKey({
        name: 'FK_role_limits_role',
        columnNames: ['role_key'],
        referencedTableName: 'roles',
        referencedColumnNames: ['key'],
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index for role_limits
    await queryRunner.createIndex(
      'role_limits',
      new TableIndex({
        name: 'uq_role_limits_role_resource',
        columnNames: ['role_key', 'resource'],
        isUnique: true,
      }),
    );

    // Create rgpd_exports table
    await queryRunner.createTable(
      new Table({
        name: 'rgpd_exports',
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
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'file_r2_key',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'requested_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
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
        ],
      }),
      true,
    );

    // Foreign key rgpd_exports -> users
    await queryRunner.createForeignKey(
      'rgpd_exports',
      new TableForeignKey({
        name: 'FK_rgpd_exports_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create index for rgpd_exports
    await queryRunner.createIndex(
      'rgpd_exports',
      new TableIndex({
        name: 'idx_rgpd_exports_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
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
            name: 'event_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reminder_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'scheduled_for',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'read_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'is_snoozed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'snoozed_until',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
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

    // Foreign key notifications -> users
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        name: 'FK_notifications_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create documents table
    await queryRunner.createTable(
      new Table({
        name: 'documents',
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
            name: 'subscription_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'original_filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_r2_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'ocr_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ocr_status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'ocr_processed_at',
            type: 'timestamptz',
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

    // Foreign key documents -> users
    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        name: 'FK_documents_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key documents -> contracts
    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        name: 'FK_documents_contract',
        columnNames: ['contract_id'],
        referencedTableName: 'contracts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.dropTable('documents');
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('rgpd_exports');
    await queryRunner.dropTable('role_limits');
    await queryRunner.dropTable('user_sessions');
    await queryRunner.dropTable('user_preferences');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('contracts');
    await queryRunner.dropTable('roles');
  }
}
