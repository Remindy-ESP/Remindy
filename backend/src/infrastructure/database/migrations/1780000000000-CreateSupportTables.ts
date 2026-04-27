import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTables1780000000000 implements MigrationInterface {
  name = 'CreateSupportTables1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."support_tickets_status_enum" AS ENUM(
          'open', 'pending_user', 'resolved', 'closed'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."support_tickets_priority_enum" AS ENUM(
          'low', 'medium', 'high', 'urgent'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."support_ticket_messages_author_type_enum" AS ENUM(
          'user', 'admin', 'system'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "subject" varchar(255) NOT NULL,
        "status" "public"."support_tickets_status_enum" NOT NULL DEFAULT 'open',
        "priority" "public"."support_tickets_priority_enum" NOT NULL DEFAULT 'medium',
        "category" varchar(50),
        "assigned_admin_id" uuid,
        "last_reply_at" timestamptz,
        "closed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_support_tickets" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_id" uuid NOT NULL,
        "author_type" "public"."support_ticket_messages_author_type_enum" NOT NULL,
        "author_user_id" uuid,
        "author_admin_id" uuid,
        "body" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_support_ticket_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "fk_support_tickets_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_tickets" ADD CONSTRAINT "fk_support_tickets_assigned_admin"
          FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "fk_support_ticket_messages_ticket"
          FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "fk_support_ticket_messages_author_user"
          FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "fk_support_ticket_messages_author_admin"
          FOREIGN KEY ("author_admin_id") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "chk_support_ticket_messages_author_ref"
          CHECK (
            ("author_type" = 'user' AND "author_user_id" IS NOT NULL AND "author_admin_id" IS NULL)
            OR
            ("author_type" = 'admin' AND "author_admin_id" IS NOT NULL AND "author_user_id" IS NULL)
            OR
            ("author_type" = 'system' AND "author_user_id" IS NULL AND "author_admin_id" IS NULL)
          );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_tickets_user_id" ON "support_tickets"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_tickets_status" ON "support_tickets"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_tickets_priority" ON "support_tickets"("priority")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_tickets_assigned_admin_id" ON "support_tickets"("assigned_admin_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_tickets_created_at" ON "support_tickets"("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_tickets_last_reply_at" ON "support_tickets"("last_reply_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_ticket_messages_ticket_id" ON "support_ticket_messages"("ticket_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_ticket_messages_author_type" ON "support_ticket_messages"("author_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_ticket_messages_created_at" ON "support_ticket_messages"("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_support_ticket_messages_ticket_created" ON "support_ticket_messages"("ticket_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_ticket_messages_ticket_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_ticket_messages_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_ticket_messages_author_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_ticket_messages_ticket_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_last_reply_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_assigned_admin_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_ticket_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets" CASCADE`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."support_ticket_messages_author_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."support_tickets_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."support_tickets_status_enum"`);
  }
}
