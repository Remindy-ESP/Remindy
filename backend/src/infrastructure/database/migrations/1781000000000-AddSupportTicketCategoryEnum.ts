import { MigrationInterface, QueryRunner } from 'typeorm';

// Renamed from 1775680471314 to 1781... so it runs AFTER
// CreateSupportTables1780000000000 — the previous timestamp put this
// migration before the table it alters, which crashed any fresh run.
export class AddSupportTicketCategoryEnum1781000000000 implements MigrationInterface {
  name = 'AddSupportTicketCategoryEnum1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('support_tickets');
    if (!tableExists) {
      console.log('Skipping AddSupportTicketCategoryEnum: support_tickets does not exist yet');
      return;
    }

    const typeAlreadyExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'support_tickets_category_enum'`,
    );
    if (!typeAlreadyExists?.length) {
      await queryRunner.query(`
        CREATE TYPE "public"."support_tickets_category_enum" AS ENUM(
          'technical',
          'billing',
          'account',
          'subscription',
          'bug',
          'feature_request',
          'other'
        )
      `);
    } else {
      console.log('Type support_tickets_category_enum already exists, skipping CREATE TYPE');
    }

    const currentType = await queryRunner.query(
      `SELECT data_type, udt_name FROM information_schema.columns
       WHERE table_name = 'support_tickets' AND column_name = 'category'`,
    );
    const isAlreadyEnum = currentType?.[0]?.udt_name === 'support_tickets_category_enum';
    if (isAlreadyEnum) {
      console.log('support_tickets.category is already the enum type, skipping ALTER');
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "support_tickets"
      ALTER COLUMN "category"
      TYPE "public"."support_tickets_category_enum"
      USING (
        CASE
          WHEN "category" IS NULL THEN NULL
          WHEN "category" IN (
            'technical',
            'billing',
            'account',
            'subscription',
            'bug',
            'feature_request',
            'other'
          ) THEN "category"::text::"public"."support_tickets_category_enum"
          ELSE 'other'::"public"."support_tickets_category_enum"
        END
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "support_tickets"
      ALTER COLUMN "category"
      TYPE varchar(50)
      USING "category"::text
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."support_tickets_category_enum"
    `);
  }
}
