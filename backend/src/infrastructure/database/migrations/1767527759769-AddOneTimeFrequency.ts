import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOneTimeFrequency1767527759769 implements MigrationInterface {
  name = 'AddOneTimeFrequency1767527759769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing frequency constraint
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP CONSTRAINT "chk_subscriptions_frequency"
    `);

    // Add the new constraint with 'one-time' included
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD CONSTRAINT "chk_subscriptions_frequency"
      CHECK (frequency IN ('one-time', 'weekly', 'monthly', 'quarterly', 'yearly'))
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
