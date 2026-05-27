import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetSubscriptionsTable1786000000000 implements MigrationInterface {
  name = 'CreateBudgetSubscriptionsTable1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budget_subscriptions" (
        "budget_id" uuid NOT NULL,
        "subscription_id" uuid NOT NULL,
        CONSTRAINT "pk_budget_subscriptions" PRIMARY KEY ("budget_id", "subscription_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_budget_subscriptions_budget_id" ON "budget_subscriptions" ("budget_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_budget_subscriptions_subscription_id" ON "budget_subscriptions" ("subscription_id")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "budget_subscriptions" ADD CONSTRAINT "fk_budget_subscriptions_budget_id"
          FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "budget_subscriptions" ADD CONSTRAINT "fk_budget_subscriptions_subscription_id"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget_subscriptions" DROP CONSTRAINT IF EXISTS "fk_budget_subscriptions_subscription_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_subscriptions" DROP CONSTRAINT IF EXISTS "fk_budget_subscriptions_budget_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_budget_subscriptions_subscription_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_budget_subscriptions_budget_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_subscriptions"`);
  }
}
