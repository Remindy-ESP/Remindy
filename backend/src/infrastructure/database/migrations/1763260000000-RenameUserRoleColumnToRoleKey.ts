import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserRoleColumnToRoleKey1763260000000 implements MigrationInterface {
  name = 'RenameUserRoleColumnToRoleKey1763260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the column from 'role' to 'role_key' in users table
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "role" TO "role_key"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: rename back from 'role_key' to 'role'
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "role_key" TO "role"
    `);
  }
}
