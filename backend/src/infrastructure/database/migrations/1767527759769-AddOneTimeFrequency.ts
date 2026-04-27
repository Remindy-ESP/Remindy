import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOneTimeFrequency1767527759769 implements MigrationInterface {
  name = 'AddOneTimeFrequency1767527759769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscriptions" DROP CONSTRAINT "chk_subscriptions_frequency";
      EXCEPTION WHEN undefined_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "chk_subscriptions_frequency"
          CHECK (frequency IN ('one-time', 'weekly', 'monthly', 'quarterly', 'yearly'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new constraint
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP CONSTRAINT "chk_subscriptions_frequency"
    `);

    // Restore the old constraint without 'one-time'
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD CONSTRAINT "chk_subscriptions_frequency"
      CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly'))
    `);
  }
}
