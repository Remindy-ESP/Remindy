import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAuditLog1735700000000 implements MigrationInterface {
  name = 'CreateAdminAuditLog1735700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create admin_audit_log table
    await queryRunner.query(`
      CREATE TABLE "admin_audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_user_id" uuid,
        "action" varchar(100) NOT NULL,
        "resource_type" varchar(50) NOT NULL,
        "resource_id" varchar(255),
        "before" jsonb,
        "after" jsonb,
        "ip_address" varchar(45),
        "user_agent" text,
        "severity" varchar(20) NOT NULL DEFAULT 'info',
        "success" boolean NOT NULL DEFAULT true,
        "error_message" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_admin_audit_log" PRIMARY KEY ("id"),
        CONSTRAINT "chk_admin_audit_severity" CHECK (severity IN ('info', 'warning', 'critical'))
      )
    `);

    // Add foreign key to users table
    await queryRunner.query(`
      ALTER TABLE "admin_audit_log"
      ADD CONSTRAINT "fk_admin_audit_log_actor"
      FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    // Create standard indexes
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_actor_user_id" ON "admin_audit_log"("actor_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_action" ON "admin_audit_log"("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_resource_type" ON "admin_audit_log"("resource_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_severity" ON "admin_audit_log"("severity")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_success" ON "admin_audit_log"("success")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_created_at" ON "admin_audit_log"("created_at")`,
    );

    // Composite indexes for common queries
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_actor_created" ON "admin_audit_log"("actor_user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_resource" ON "admin_audit_log"("resource_type", "resource_id")`,
    );

    // GIN indexes for JSONB full-text search
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_before_gin" ON "admin_audit_log" USING GIN ("before")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admin_audit_log_after_gin" ON "admin_audit_log" USING GIN ("after")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_after_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_before_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_resource"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_actor_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_success"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_resource_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_audit_log_actor_user_id"`);

    // Drop table (cascade drops foreign key)
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit_log" CASCADE`);
  }
}
