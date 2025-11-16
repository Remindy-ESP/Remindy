import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventsTableConstraintsAndIndexes1763254900000 implements MigrationInterface {
  name = 'AddEventsTableConstraintsAndIndexes1763254900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key constraint for event_series_id
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "fk_events_event_series"
      FOREIGN KEY ("event_series_id")
      REFERENCES "event_series"("id")
      ON DELETE SET NULL
    `);

    // Add CHECK constraint for amount (must be positive)
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "chk_events_amount_positive"
      CHECK (amount > 0)
    `);

    // Add CHECK constraint for status (valid values)
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "chk_events_status"
      CHECK (status IN ('scheduled', 'completed', 'canceled', 'failed'))
    `);

    // Add CHECK constraint for payment_status (valid values)
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "chk_events_payment_status"
      CHECK (payment_status IN ('pending', 'paid', 'failed'))
    `);

    // Add CHECK constraint for date range (ends_at must be after starts_at)
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "chk_events_date_range"
      CHECK (ends_at IS NULL OR ends_at > starts_at)
    `);

    // Create index on subscription_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_events_subscription_id"
      ON "events"("subscription_id")
    `);

    // Create index on event_series_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_events_event_series_id"
      ON "events"("event_series_id")
      WHERE "event_series_id" IS NOT NULL
    `);

    // Create index on starts_at for date range queries
    await queryRunner.query(`
      CREATE INDEX "idx_events_starts_at"
      ON "events"("starts_at")
    `);

    // Create index on status for filtering
    await queryRunner.query(`
      CREATE INDEX "idx_events_status"
      ON "events"("status")
    `);

    // Create composite index for common queries (subscription_id + starts_at)
    await queryRunner.query(`
      CREATE INDEX "idx_events_subscription_starts"
      ON "events"("subscription_id", "starts_at")
    `);

    // Create partial index for non-deleted events
    await queryRunner.query(`
      CREATE INDEX "idx_events_not_deleted"
      ON "events"("id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_events_not_deleted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_events_subscription_starts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_events_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_events_starts_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_events_event_series_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_events_subscription_id"`);

    // Drop CHECK constraints
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "chk_events_date_range"`);
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "chk_events_payment_status"`);
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "chk_events_status"`);
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "chk_events_amount_positive"`);

    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "fk_events_event_series"`);
  }
}
