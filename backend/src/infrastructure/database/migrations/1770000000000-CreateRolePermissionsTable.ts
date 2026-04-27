import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissionsTable1770000000000 implements MigrationInterface {
  name = 'CreateRolePermissionsTable1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_key" text NOT NULL,
        "permission" varchar(100) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_role_permission" UNIQUE ("role_key", "permission")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_key" ON "role_permissions"("role_key")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission" ON "role_permissions"("permission")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_role"
          FOREIGN KEY ("role_key") REFERENCES "roles"("key") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
  }
}
