import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRemindersTable1763256154256 implements MigrationInterface {
  name = 'CreateRemindersTable1763256154256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reminders table
    await queryRunner.query(`
      CREATE TABLE "reminders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "subscription_id" uuid,
        "type" character varying(50) NOT NULL,
        "days_before" integer NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "channel" character varying(20) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_reminders" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for user_id
    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "fk_reminders_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Add foreign key constraint for subscription_id
    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "fk_reminders_subscription"
      FOREIGN KEY ("subscription_id")
      REFERENCES "subscriptions"("id")
      ON DELETE CASCADE
    `);

    // Add CHECK constraint for type
    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "chk_reminders_type"
      CHECK (type IN ('subscription_renewal', 'trial_ending', 'payment_due', 'payment_failed', 'budget_alert'))
    `);

    // Add CHECK constraint for channel
    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "chk_reminders_channel"
      CHECK (channel IN ('email', 'push', 'sms'))
    `);

    // Add CHECK constraint for days_before (must be positive)
    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "chk_reminders_days_before_positive"
      CHECK (days_before > 0)
    `);

    // Create index on user_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_user_id"
      ON "reminders"("user_id")
    `);

    // Create index on subscription_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_subscription_id"
      ON "reminders"("subscription_id")
      WHERE "subscription_id" IS NOT NULL
    `);

    // Create index on type for filtering
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_type"
      ON "reminders"("type")
    `);

    // Create index on enabled for active reminders
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_enabled"
      ON "reminders"("enabled")
      WHERE "enabled" = true
    `);

    // Create composite index for user + subscription queries
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_user_subscription"
      ON "reminders"("user_id", "subscription_id")
    `);

    // Create partial index for non-deleted reminders
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_not_deleted"
      ON "reminders"("id")
      WHERE "deleted_at" IS NULL
    `);

    // Add unique constraint to prevent duplicate reminders for same user/subscription/type
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_reminders_user_subscription_type"
      ON "reminders"("user_id", "subscription_id", "type", "channel")
      WHERE "subscription_id" IS NOT NULL AND "deleted_at" IS NULL
    `);

    // Add unique constraint for global reminders (no subscription_id)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_reminders_user_global_type"
      ON "reminders"("user_id", "type", "channel")
      WHERE "subscription_id" IS NULL AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraints
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_reminders_user_global_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_reminders_user_subscription_type"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reminders_not_deleted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reminders_user_subscription"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reminders_enabled"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reminders_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reminders_subscription_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reminders_user_id"`);

    // Drop CHECK constraints
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "chk_reminders_days_before_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "chk_reminders_channel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "chk_reminders_type"`,
    );

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "fk_reminders_subscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "fk_reminders_user"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "reminders"`);
  }
}
