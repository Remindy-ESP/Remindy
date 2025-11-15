import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionCheckConstraints1763236907972 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add CHECK constraint: amount must be positive
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD CONSTRAINT chk_subscriptions_amount_positive
      CHECK (amount > 0)
    `);

    // Add CHECK constraint: trial dates validation
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD CONSTRAINT chk_subscriptions_trial_dates
      CHECK (
        trial_start_date IS NULL OR
        trial_end_date IS NULL OR
        trial_end_date > trial_start_date
      )
    `);

    // Add CHECK constraint: frequency must be valid
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD CONSTRAINT chk_subscriptions_frequency
      CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly'))
    `);

    // Add CHECK constraint: status must be valid
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD CONSTRAINT chk_subscriptions_status
      CHECK (status IN ('active', 'paused', 'cancelled', 'trial'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all CHECK constraints in reverse order
    await queryRunner.query(`
      ALTER TABLE subscriptions
      DROP CONSTRAINT IF EXISTS chk_subscriptions_status
    `);

    await queryRunner.query(`
      ALTER TABLE subscriptions
      DROP CONSTRAINT IF EXISTS chk_subscriptions_frequency
    `);

    await queryRunner.query(`
      ALTER TABLE subscriptions
      DROP CONSTRAINT IF EXISTS chk_subscriptions_trial_dates
    `);

    await queryRunner.query(`
      ALTER TABLE subscriptions
      DROP CONSTRAINT IF EXISTS chk_subscriptions_amount_positive
    `);
  }
}
