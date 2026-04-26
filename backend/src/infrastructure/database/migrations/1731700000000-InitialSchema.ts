import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1731700000000 implements MigrationInterface {
  name = 'InitialSchema1731700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== CREATE TABLES WITHOUT FOREIGN KEYS FIRST =====

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "key" text NOT NULL,
        "label" varchar(100) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_roles" PRIMARY KEY ("key")
      )
    `);

    // Create contracts table
    await queryRunner.query(`
      CREATE TABLE "contracts" (
        "id" SERIAL NOT NULL,
        "type" varchar(50) NOT NULL,
        "label" varchar(100) NOT NULL,
        "icon" varchar(50),
        "color" varchar(7),
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_contracts" PRIMARY KEY ("id"),
        CONSTRAINT "uq_contracts_type" UNIQUE ("type")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255),
        "first_name" varchar(100),
        "last_name" varchar(100),
        "phone" varchar(20),
        "photo_r2_key" varchar(500),
        "role_key" text NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "timezone" varchar(50) NOT NULL DEFAULT 'Europe/Paris',
        "language" varchar(10) NOT NULL DEFAULT 'fr',
        "email_verified" boolean NOT NULL DEFAULT false,
        "mfa_enabled" boolean NOT NULL DEFAULT false,
        "mfa_secret" varchar(255),
        "last_login_at" timestamptz,
        "failed_login_count" integer NOT NULL DEFAULT 0,
        "password_changed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )
    `);

    // Create user_preferences table
    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "user_id" uuid NOT NULL,
        "theme" varchar(20) NOT NULL DEFAULT 'light',
        "notification_email" boolean NOT NULL DEFAULT true,
        "notification_push" boolean NOT NULL DEFAULT true,
        "notification_sms" boolean NOT NULL DEFAULT false,
        "default_reminder_delay" integer NOT NULL DEFAULT 24,
        "show_online_status" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_user_preferences" PRIMARY KEY ("user_id"),
        CONSTRAINT "chk_default_reminder_delay_positive" CHECK (default_reminder_delay > 0)
      )
    `);

    // Create user_sessions table
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" varchar(255) NOT NULL,
        "ip_address" varchar(45),
        "user_agent" text,
        "expires_at" timestamptz NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_user_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_user_sessions_refresh_token" UNIQUE ("refresh_token_hash")
      )
    `);

    // Create role_limits table
    await queryRunner.query(`
      CREATE TABLE "role_limits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_key" text NOT NULL,
        "resource" varchar(50) NOT NULL,
        "max_count" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_role_limits" PRIMARY KEY ("id"),
        CONSTRAINT "chk_max_count_positive" CHECK (max_count > 0),
        CONSTRAINT "uq_role_limits_role_resource" UNIQUE ("role_key", "resource")
      )
    `);

    // Create rgpd_exports table
    await queryRunner.query(`
      CREATE TABLE "rgpd_exports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "file_r2_key" varchar(500),
        "requested_at" timestamptz NOT NULL DEFAULT now(),
        "completed_at" timestamptz,
        "expires_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rgpd_exports" PRIMARY KEY ("id")
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "contract_id" integer,
        "name" varchar(255) NOT NULL,
        "amount" numeric(19,4) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'EUR',
        "frequency" varchar(20) NOT NULL,
        "start_date" date NOT NULL,
        "next_due_date" date NOT NULL,
        "trial_start_date" date,
        "trial_end_date" date,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "color" varchar(7),
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamp,
        CONSTRAINT "pk_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "chk_subscriptions_amount_positive" CHECK (amount > 0),
        CONSTRAINT "chk_subscriptions_trial_dates" CHECK (
          trial_start_date IS NULL OR
          trial_end_date IS NULL OR
          trial_end_date > trial_start_date
        ),
        CONSTRAINT "chk_subscriptions_frequency" CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
        CONSTRAINT "chk_subscriptions_status" CHECK (status IN ('active', 'paused', 'cancelled', 'trial'))
      )
    `);

    // Create event_series table
    await queryRunner.query(`
      CREATE TABLE "event_series" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscription_id" uuid NOT NULL,
        "rrule" text NOT NULL,
        "dtstart" timestamptz NOT NULL,
        "timezone" varchar(50) NOT NULL DEFAULT 'Europe/Paris',
        "exdates" timestamptz[],
        "rdates" timestamptz[],
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_event_series" PRIMARY KEY ("id"),
        CONSTRAINT "uq_event_series_subscription" UNIQUE ("subscription_id")
      )
    `);

    // Create events table
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscription_id" uuid NOT NULL,
        "event_series_id" uuid,
        "title" varchar(255) NOT NULL,
        "amount" numeric(19,4) NOT NULL,
        "starts_at" timestamptz NOT NULL,
        "ends_at" timestamptz,
        "status" varchar(20) NOT NULL DEFAULT 'scheduled',
        "payment_status" varchar(20),
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_events" PRIMARY KEY ("id"),
        CONSTRAINT "chk_events_amount_positive" CHECK (amount > 0),
        CONSTRAINT "chk_events_status" CHECK (status IN ('scheduled', 'completed', 'canceled', 'failed')),
        CONSTRAINT "chk_events_payment_status" CHECK (payment_status IN ('pending', 'paid', 'failed')),
        CONSTRAINT "chk_events_date_range" CHECK (ends_at IS NULL OR ends_at > starts_at)
      )
    `);

    // Create reminders table
    await queryRunner.query(`
      CREATE TABLE "reminders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "subscription_id" uuid,
        "type" varchar(50) NOT NULL,
        "days_before" integer NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "channel" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_reminders" PRIMARY KEY ("id"),
        CONSTRAINT "chk_reminders_type" CHECK (type IN ('subscription_renewal', 'trial_ending', 'payment_due', 'payment_failed', 'budget_alert')),
        CONSTRAINT "chk_reminders_channel" CHECK (channel IN ('email', 'push', 'sms')),
        CONSTRAINT "chk_reminders_days_before_positive" CHECK (days_before > 0)
      )
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "event_id" uuid,
        "reminder_id" uuid,
        "type" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "channel" varchar(20) NOT NULL,
        "scheduled_for" timestamptz NOT NULL,
        "sent_at" timestamptz,
        "read_at" timestamptz,
        "is_snoozed" boolean NOT NULL DEFAULT false,
        "snoozed_until" timestamptz,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "chk_notifications_type" CHECK (type IN ('reminder', 'payment_overdue', 'trial_ending', 'subscription_renewed', 'document_processed')),
        CONSTRAINT "chk_notifications_channel" CHECK (channel IN ('email', 'push', 'sms')),
        CONSTRAINT "chk_notifications_status" CHECK (status IN ('pending', 'sent', 'failed', 'snoozed')),
        CONSTRAINT "chk_notifications_snoozed_until" CHECK (
          (status = 'snoozed' AND snoozed_until IS NOT NULL AND snoozed_until > created_at) OR
          (status != 'snoozed')
        )
      )
    `);

    // Create documents table
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "contract_id" integer,
        "subscription_id" uuid,
        "filename" varchar(255) NOT NULL,
        "original_filename" varchar(255) NOT NULL,
        "file_r2_key" varchar(500) NOT NULL,
        "file_size" integer NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "ocr_text" text,
        "ocr_status" varchar(20) NOT NULL DEFAULT 'pending',
        "ocr_processed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_documents" PRIMARY KEY ("id")
      )
    `);

    // ===== ADD FOREIGN KEYS =====

    // Foreign keys for users
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "fk_users_role"
      FOREIGN KEY ("role_key") REFERENCES "roles"("key")
      ON DELETE RESTRICT
    `);

    // Foreign keys for user_preferences
    await queryRunner.query(`
      ALTER TABLE "user_preferences"
      ADD CONSTRAINT "fk_user_preferences_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Foreign keys for user_sessions
    await queryRunner.query(`
      ALTER TABLE "user_sessions"
      ADD CONSTRAINT "fk_user_sessions_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Foreign keys for role_limits
    await queryRunner.query(`
      ALTER TABLE "role_limits"
      ADD CONSTRAINT "fk_role_limits_role"
      FOREIGN KEY ("role_key") REFERENCES "roles"("key")
      ON DELETE CASCADE
    `);

    // Foreign keys for rgpd_exports
    await queryRunner.query(`
      ALTER TABLE "rgpd_exports"
      ADD CONSTRAINT "fk_rgpd_exports_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Foreign keys for subscriptions
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "fk_subscriptions_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "fk_subscriptions_contract"
      FOREIGN KEY ("contract_id") REFERENCES "contracts"("id")
      ON DELETE SET NULL
    `);

    // Foreign keys for event_series
    await queryRunner.query(`
      ALTER TABLE "event_series"
      ADD CONSTRAINT "fk_event_series_subscription"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
      ON DELETE CASCADE
    `);

    // Foreign keys for events
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "fk_events_subscription"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "fk_events_event_series"
      FOREIGN KEY ("event_series_id") REFERENCES "event_series"("id")
      ON DELETE SET NULL
    `);

    // Foreign keys for reminders
    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "fk_reminders_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "fk_reminders_subscription"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
      ON DELETE CASCADE
    `);

    // Foreign keys for notifications
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "fk_notifications_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "fk_notifications_event"
      FOREIGN KEY ("event_id") REFERENCES "events"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "fk_notifications_reminder"
      FOREIGN KEY ("reminder_id") REFERENCES "reminders"("id")
      ON DELETE SET NULL
    `);

    // Foreign keys for documents
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "fk_documents_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "fk_documents_contract"
      FOREIGN KEY ("contract_id") REFERENCES "contracts"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "fk_documents_subscription"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
      ON DELETE SET NULL
    `);

    // ===== CREATE INDEXES =====

    // Indexes for users
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users"("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users"("role_key")`);
    await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at")`);
    await queryRunner.query(`CREATE INDEX "idx_users_last_login" ON "users"("last_login_at")`);
    await queryRunner.query(
      `CREATE INDEX "idx_users_failed_login" ON "users"("failed_login_count")`,
    );

    // Indexes for user_sessions
    await queryRunner.query(
      `CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_sessions_refresh_token_hash" ON "user_sessions"("refresh_token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_sessions_expires_at" ON "user_sessions"("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_sessions_is_revoked" ON "user_sessions"("is_revoked")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_sessions_deleted_at" ON "user_sessions"("deleted_at")`,
    );

    // Indexes for rgpd_exports
    await queryRunner.query(`CREATE INDEX "idx_rgpd_exports_user_id" ON "rgpd_exports"("user_id")`);

    // Indexes for subscriptions
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_contract_id" ON "subscriptions"("contract_id")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_next_due_date" ON "subscriptions"("next_due_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_start_date" ON "subscriptions"("start_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_created_at" ON "subscriptions"("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_deleted_at" ON "subscriptions"("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_frequency" ON "subscriptions"("frequency")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_subscriptions_user_name"
      ON "subscriptions"("user_id", LOWER("name"))
      WHERE "deleted_at" IS NULL
    `);

    // Indexes for event_series
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_event_series_subscription_id" ON "event_series"("subscription_id")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_event_series_dtstart" ON "event_series"("dtstart")`);
    await queryRunner.query(`
      CREATE INDEX "idx_event_series_deleted_at"
      ON "event_series"("deleted_at")
      WHERE "deleted_at" IS NULL
    `);

    // Indexes for events
    await queryRunner.query(
      `CREATE INDEX "idx_events_subscription_id" ON "events"("subscription_id")`,
    );
    await queryRunner.query(`
      CREATE INDEX "idx_events_event_series_id"
      ON "events"("event_series_id")
      WHERE "event_series_id" IS NOT NULL
    `);
    await queryRunner.query(`CREATE INDEX "idx_events_starts_at" ON "events"("starts_at")`);
    await queryRunner.query(`CREATE INDEX "idx_events_status" ON "events"("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_events_subscription_starts" ON "events"("subscription_id", "starts_at")`,
    );
    await queryRunner.query(`
      CREATE INDEX "idx_events_not_deleted"
      ON "events"("id")
      WHERE "deleted_at" IS NULL
    `);

    // Indexes for reminders
    await queryRunner.query(`CREATE INDEX "idx_reminders_user_id" ON "reminders"("user_id")`);
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_subscription_id"
      ON "reminders"("subscription_id")
      WHERE "subscription_id" IS NOT NULL
    `);
    await queryRunner.query(`CREATE INDEX "idx_reminders_type" ON "reminders"("type")`);
    await queryRunner.query(`CREATE INDEX "idx_reminders_enabled" ON "reminders"("enabled")`);
    await queryRunner.query(`
      CREATE INDEX "idx_reminders_not_deleted"
      ON "reminders"("id")
      WHERE "deleted_at" IS NULL
    `);

    // Indexes for notifications
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id")`,
    );
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_event_id"
      ON "notifications"("event_id")
      WHERE "event_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_reminder_id"
      ON "notifications"("reminder_id")
      WHERE "reminder_id" IS NOT NULL
    `);
    await queryRunner.query(`CREATE INDEX "idx_notifications_type" ON "notifications"("type")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_status" ON "notifications"("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_channel" ON "notifications"("channel")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at")`,
    );
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_sent_at"
      ON "notifications"("sent_at")
      WHERE "sent_at" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_unread"
      ON "notifications"("user_id", "read_at")
      WHERE "read_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_snoozed"
      ON "notifications"("snoozed_until")
      WHERE "status" = 'snoozed' AND "snoozed_until" IS NOT NULL
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_status_created" ON "notifications"("user_id", "status", "created_at")`,
    );
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_not_deleted"
      ON "notifications"("id")
      WHERE "deleted_at" IS NULL
    `);

    // Indexes for documents
    await queryRunner.query(`CREATE INDEX "idx_documents_user_id" ON "documents"("user_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_documents_contract_id" ON "documents"("contract_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_subscription_id" ON "documents"("subscription_id")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_documents_ocr_status" ON "documents"("ocr_status")`);
    await queryRunner.query(`
      CREATE INDEX "idx_documents_not_deleted"
      ON "documents"("id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reminders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_series" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rgpd_exports" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_limits" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_preferences" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contracts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
  }
}
