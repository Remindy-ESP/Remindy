import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategories1734000000000 implements MigrationInterface {
  name = 'AddCategories1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
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

    // Create index on user_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_categories_user_id" ON "categories" ("user_id")
    `);

    // Create index on is_system for filtering system categories
    await queryRunner.query(`
      CREATE INDEX "idx_categories_is_system" ON "categories" ("is_system")
    `);

    // Add foreign key constraint to users table
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD CONSTRAINT "fk_categories_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add category_id column to subscriptions table
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN "category_id" uuid NULL
    `);

    // Create index on category_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_category_id" ON "subscriptions" ("category_id")
    `);

    // Add foreign key constraint from subscriptions to categories
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "fk_subscriptions_category_id"
      FOREIGN KEY ("category_id")
      REFERENCES "categories"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Insert system categories
    await queryRunner.query(`
      INSERT INTO "categories" ("id", "name", "icon", "color", "user_id", "is_system", "created_at", "updated_at")
      VALUES
        (uuid_generate_v4(), 'Streaming', '<�', '#E50914', NULL, true, now(), now()),
        (uuid_generate_v4(), 'Internet', '<', '#4285F4', NULL, true, now(), now()),
        (uuid_generate_v4(), 'Mobile', '=�', '#34A853', NULL, true, now(), now()),
        (uuid_generate_v4(), 'Insurance', '=�', '#0088CC', NULL, true, now(), now()),
        (uuid_generate_v4(), 'Utilities', '�', '#FBBC04', NULL, true, now(), now()),
        (uuid_generate_v4(), 'Subscriptions', '=�', '#9C27B0', NULL, true, now(), now()),
        (uuid_generate_v4(), 'Other', '=�', '#607D8B', NULL, true, now(), now())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key from subscriptions
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP CONSTRAINT "fk_subscriptions_category_id"
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX "idx_subscriptions_category_id"
    `);

    // Remove category_id column from subscriptions
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN "category_id"
    `);

    // Remove foreign key from categories
    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP CONSTRAINT "fk_categories_user_id"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_categories_is_system"
    `);

    await queryRunner.query(`
      DROP INDEX "idx_categories_user_id"
    `);

    // Drop categories table
    await queryRunner.query(`
      DROP TABLE "categories"
    `);
  }
}
