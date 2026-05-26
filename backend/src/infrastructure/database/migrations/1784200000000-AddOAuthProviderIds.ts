import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOAuthProviderIds1784200000000 implements MigrationInterface {
  name = 'AddOAuthProviderIds1784200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "googleId" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_googleId" UNIQUE ("googleId")`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "microsoftId" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_microsoftId" UNIQUE ("microsoftId")`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "appleId" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_appleId" UNIQUE ("appleId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_appleId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "appleId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_microsoftId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "microsoftId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_googleId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleId"`);
  }
}
