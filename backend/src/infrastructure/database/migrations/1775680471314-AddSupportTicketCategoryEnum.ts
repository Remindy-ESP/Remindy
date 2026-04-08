import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportTicketCategoryEnum1775680471314 implements MigrationInterface {
  name = 'AddSupportTicketCategoryEnum1775680471314';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      DROP TYPE "public"."support_tickets_category_enum"
    `);
  }
}
