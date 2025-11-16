import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsConstraintsAndIndexes1763256200000 implements MigrationInterface {
  name = 'AddNotificationsConstraintsAndIndexes1763256200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key constraint for reminder_id (now that reminders table exists)
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "fk_notifications_reminder"
      FOREIGN KEY ("reminder_id")
      REFERENCES "reminders"("id")
      ON DELETE SET NULL
    `);

    // Add CHECK constraint for type
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "chk_notifications_type"
      CHECK (type IN ('reminder', 'payment_overdue', 'trial_ending', 'subscription_renewed', 'document_processed'))
    `);

    // Add CHECK constraint for channel
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "chk_notifications_channel"
      CHECK (channel IN ('email', 'push', 'sms'))
    `);

    // Add CHECK constraint for status
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "chk_notifications_status"
      CHECK (status IN ('pending', 'sent', 'failed', 'snoozed'))
    `);

    // Add CHECK constraint for snoozed_until (must be in future if snoozed)
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "chk_notifications_snoozed_until"
      CHECK (
        (status = 'snoozed' AND snoozed_until IS NOT NULL AND snoozed_until > created_at) OR
        (status != 'snoozed')
      )
    `);

    // Create index on user_id for faster user queries
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id"
      ON "notifications"("user_id")
    `);

    // Create index on event_id
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_event_id"
      ON "notifications"("event_id")
      WHERE "event_id" IS NOT NULL
    `);

    // Create index on reminder_id
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_reminder_id"
      ON "notifications"("reminder_id")
      WHERE "reminder_id" IS NOT NULL
    `);

    // Create index on type for filtering
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_type"
      ON "notifications"("type")
    `);

    // Create index on status for filtering
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_status"
      ON "notifications"("status")
    `);

    // Create index on channel for filtering
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_channel"
      ON "notifications"("channel")
    `);

    // Create index on created_at for sorting
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_created_at"
      ON "notifications"("created_at")
    `);

    // Create index on sent_at for sorting
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_sent_at"
      ON "notifications"("sent_at")
      WHERE "sent_at" IS NOT NULL
    `);

    // Create index on read_at for unread notifications
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_unread"
      ON "notifications"("user_id", "read_at")
      WHERE "read_at" IS NULL
    `);

    // Create index on snoozed notifications
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_snoozed"
      ON "notifications"("snoozed_until")
      WHERE "status" = 'snoozed' AND "snoozed_until" IS NOT NULL
    `);

    // Create composite index for common user queries
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_status_created"
      ON "notifications"("user_id", "status", "created_at")
    `);

    // Create partial index for non-deleted notifications
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_not_deleted"
      ON "notifications"("id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_not_deleted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_snoozed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_unread"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_sent_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_channel"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_reminder_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_event_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_id"`);

    // Drop CHECK constraints
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "chk_notifications_snoozed_until"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "chk_notifications_status"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "chk_notifications_channel"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "chk_notifications_type"`);

    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "fk_notifications_reminder"`);
  }
}
