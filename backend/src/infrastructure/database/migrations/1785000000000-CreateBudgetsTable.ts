import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetsTable1785000000000 implements MigrationInterface {
  name = 'CreateBudgetsTable1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budgets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "category_id" uuid NULL,
        "name" varchar(100) NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'EUR',
        "period" varchar(20) NOT NULL,
        "start_date" timestamptz NOT NULL,
        "end_date" timestamptz NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "notes" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "pk_budgets" PRIMARY KEY ("id"),
        CONSTRAINT "chk_budgets_amount_positive" CHECK ("amount" > 0),
        CONSTRAINT "chk_budgets_period" CHECK ("period" IN ('monthly', 'yearly'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_budgets_user_id" ON "budgets" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_budgets_category_id" ON "budgets" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_budgets_active" ON "budgets" ("is_active")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "budgets" ADD CONSTRAINT "fk_budgets_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "budgets" ADD CONSTRAINT "fk_budgets_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "fk_budgets_category_id"`,
    );
    await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "fk_budgets_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_budgets_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_budgets_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_budgets_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budgets"`);
  }
}
