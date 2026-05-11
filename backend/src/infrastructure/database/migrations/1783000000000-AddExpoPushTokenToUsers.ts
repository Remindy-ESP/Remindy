import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpoPushTokenToUsers1783000000000 implements MigrationInterface {
  name = 'AddExpoPushTokenToUsers1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "expoPushToken" VARCHAR(255) DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "expoPushToken"`);
  }
}
