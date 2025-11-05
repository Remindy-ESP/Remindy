import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762088629931 implements MigrationInterface {
  name = 'InitialSchema1762088629931';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "role_limits" ("role" text NOT NULL, "maxSubscriptions" integer, "maxDocuments" integer, "maxDocumentSizeMb" integer, "maxRemindersPerSubscription" integer, "canExportData" boolean NOT NULL DEFAULT true, "canUseOcr" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_12fac9aa3515aa65a6d96f731cd" PRIMARY KEY ("role"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("key" text NOT NULL, "label" character varying(100) NOT NULL, "description" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a87cf0659c3ac379b339acf36a2" PRIMARY KEY ("key"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_roles_key" ON "roles" ("key") `);
    await queryRunner.query(
      `CREATE TYPE "public"."user_preferences_theme_enum" AS ENUM('light', 'dark', 'auto')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_preferences" ("userId" uuid NOT NULL, "theme" "public"."user_preferences_theme_enum" NOT NULL DEFAULT 'light', "notificationEmail" boolean NOT NULL DEFAULT true, "notificationPush" boolean NOT NULL DEFAULT true, "notificationSms" boolean NOT NULL DEFAULT false, "defaultReminderDelay" integer NOT NULL DEFAULT '3', "currency" character varying(3) NOT NULL DEFAULT 'EUR', "showOnlineStatus" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_b6202d1cacc63a0b9c8dac2abd4" PRIMARY KEY ("userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "refreshTokenHash" character varying(255) NOT NULL, "deviceName" character varying(100), "ipAddress" inet NOT NULL, "userAgent" text, "lastActivity" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "isRevoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_ed9d6042a764c80befeeacc595e" UNIQUE ("refreshTokenHash"), CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_sessions_expires_at" ON "user_sessions" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_user_sessions_refresh_token_hash" ON "user_sessions" ("refreshTokenHash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" ("userId") `,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "photoR2Key" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "role" text NOT NULL`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'verified', 'banned', 'inactive')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "timezone" character varying(50) NOT NULL DEFAULT 'Europe/Paris'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "language" character varying(10) NOT NULL DEFAULT 'fr'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "mfaEnabled" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD "mfaSecret" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "failedLoginCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "passwordChangedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "email" citext NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "passwordHash" character varying(255)`);
    await queryRunner.query(`CREATE INDEX "idx_users_last_login" ON "users" ("lastLoginAt") `);
    await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users" ("status") `);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email") `);
    await queryRunner.query(
      `ALTER TABLE "role_limits" ADD CONSTRAINT "FK_12fac9aa3515aa65a6d96f731cd" FOREIGN KEY ("role") REFERENCES "roles"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_ace513fa30d485cfd25c11a9e4a" FOREIGN KEY ("role") REFERENCES "roles"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_55fa4db8406ed66bc7044328427"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_ace513fa30d485cfd25c11a9e4a"`);
    await queryRunner.query(
      `ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_limits" DROP CONSTRAINT "FK_12fac9aa3515aa65a6d96f731cd"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_role"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_last_login"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "passwordHash" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordChangedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failedLoginCount"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaSecret"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaEnabled"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "language"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "timezone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "photoR2Key"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_sessions_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_sessions_refresh_token_hash"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_sessions_expires_at"`);
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(`DROP TABLE "user_preferences"`);
    await queryRunner.query(`DROP TYPE "public"."user_preferences_theme_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_roles_key"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "role_limits"`);
  }
}
