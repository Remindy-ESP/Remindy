import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminSecurityTables1700000000000 implements MigrationInterface {
  name = 'CreateAdminSecurityTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventType" varchar(80) NOT NULL,
        "severity" varchar(20) NOT NULL DEFAULT 'info',
        "userId" uuid,
        "userEmail" varchar(255),
        "ipAddress" varchar(45),
        "userAgent" text,
        "resource" varchar(255),
        "metadata" jsonb,
        "isSuspicious" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_security_logs" PRIMARY KEY ("id")
      )
    `);

    for (const col of [
      'eventType',
      'severity',
      'ipAddress',
      'userId',
      'isSuspicious',
      'createdAt',
    ]) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_security_logs_${col}" ON "security_logs"("${col}")`,
      );
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blocked_ips" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ipAddress" varchar(45) NOT NULL,
        "reason" varchar(40) NOT NULL,
        "notes" text,
        "blockedUntil" timestamptz,
        "isActive" boolean NOT NULL DEFAULT true,
        "blockedBy" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_blocked_ips" PRIMARY KEY ("id"),
        CONSTRAINT "uq_blocked_ips_ipAddress" UNIQUE ("ipAddress")
      )
    `);

    for (const col of ['isActive', 'blockedUntil']) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_blocked_ips_${col}" ON "blocked_ips"("${col}")`,
      );
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security_policy" (
        "id" varchar(20) NOT NULL,
        "maxLoginAttempts" int NOT NULL DEFAULT 5,
        "lockoutDurationMinutes" int NOT NULL DEFAULT 15,
        "sessionTimeoutMinutes" int NOT NULL DEFAULT 60,
        "requireMfaForAdmin" boolean NOT NULL DEFAULT true,
        "minPasswordLength" int NOT NULL DEFAULT 8,
        "requireUppercase" boolean NOT NULL DEFAULT true,
        "requireNumbers" boolean NOT NULL DEFAULT true,
        "requireSpecialChars" boolean NOT NULL DEFAULT true,
        "passwordExpiryDays" int NOT NULL DEFAULT 90,
        "rateLimitPerMinute" int NOT NULL DEFAULT 100,
        "autoBlockAfterRequests" int NOT NULL DEFAULT 20,
        "autoBlockDurationMinutes" int NOT NULL DEFAULT 60,
        "allowedOrigins" text NOT NULL DEFAULT '',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_security_policy" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `INSERT INTO security_policy (id) VALUES ('global') ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "security_policy" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blocked_ips" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "security_logs" CASCADE`);
  }
}
