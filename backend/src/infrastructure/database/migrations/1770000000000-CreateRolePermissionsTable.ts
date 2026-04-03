import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateRolePermissionsTable1770000000000 implements MigrationInterface {
  name = 'CreateRolePermissionsTable1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
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
            name: 'permission',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        uniques: [{ name: 'uq_role_permission', columnNames: ['role_key', 'permission'] }],
      }),
      true,
    );

    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({ name: 'idx_role_permissions_role_key', columnNames: ['role_key'] }),
    );

    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({ name: 'idx_role_permissions_permission', columnNames: ['permission'] }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'fk_role_permissions_role',
        columnNames: ['role_key'],
        referencedTableName: 'roles',
        referencedColumnNames: ['key'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('role_permissions', true);
  }
}
