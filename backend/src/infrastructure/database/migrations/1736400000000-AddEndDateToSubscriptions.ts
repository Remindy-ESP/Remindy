import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEndDateToSubscriptions1736400000000 implements MigrationInterface {
  name = 'AddEndDateToSubscriptions1736400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add end_date column to subscriptions table
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN "end_date" date NULL
    `);

    // Add check constraint to ensure end_date is after start_date
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "chk_subscriptions_end_date_after_start"
      CHECK (end_date IS NULL OR end_date > start_date)
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
