import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategories1734000000000 implements MigrationInterface {
  name = 'AddCategories1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "icon" varchar(50) NOT NULL,
        "color" varchar(7) NOT NULL,
        "user_id" uuid NULL,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "pk_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_categories_user_id" ON "categories" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_categories_is_system" ON "categories" ("is_system")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "categories" ADD CONSTRAINT "fk_categories_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "category_id" uuid NULL
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_subscriptions_category_id" ON "subscriptions" ("category_id")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "fk_subscriptions_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM "categories" WHERE "is_system" = true) THEN
          INSERT INTO "categories" ("id", "name", "icon", "color", "user_id", "is_system", "created_at", "updated_at")
          VALUES
            (uuid_generate_v4(), 'Streaming', '<🎥', '#E50914', NULL, true, now(), now()),
            (uuid_generate_v4(), 'Internet', '<🌐', '#4285F4', NULL, true, now(), now()),
            (uuid_generate_v4(), 'Mobile', '=📱', '#34A853', NULL, true, now(), now()),
            (uuid_generate_v4(), 'Insurance', '=🛡', '#0088CC', NULL, true, now(), now()),
            (uuid_generate_v4(), 'Utilities', '⚡', '#FBBC04', NULL, true, now(), now()),
            (uuid_generate_v4(), 'Subscriptions', '=💳', '#9C27B0', NULL, true, now(), now()),
            (uuid_generate_v4(), 'Other', '=🗂', '#607D8B', NULL, true, now(), now());
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP CONSTRAINT IF EXISTS "fk_subscriptions_category_id"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_category_id"`);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "category_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP CONSTRAINT IF EXISTS "fk_categories_user_id"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_categories_is_system"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_categories_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
