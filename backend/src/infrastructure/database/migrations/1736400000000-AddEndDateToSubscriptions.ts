import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEndDateToSubscriptions1736400000000 implements MigrationInterface {
  name = 'AddEndDateToSubscriptions1736400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "end_date" date NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscriptions"
          ADD CONSTRAINT "chk_subscriptions_end_date_after_start"
          CHECK (end_date IS NULL OR end_date > start_date);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the check constraint first
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP CONSTRAINT IF EXISTS "chk_subscriptions_end_date_after_start"
    `);

    // Drop the end_date column
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN "end_date"
    `);
  }
}
