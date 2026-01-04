import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFolderIdToDocuments1700000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if folder_id column exists
        const hasColumn = await queryRunner.hasColumn('documents', 'folder_id');

        if (!hasColumn) {
            // Add folder_id column
            await queryRunner.query(`
        ALTER TABLE "documents" 
        ADD COLUMN "folder_id" uuid NULL
      `);

            // Create index on folder_id
            await queryRunner.query(`
        CREATE INDEX "idx_documents_folder_id" ON "documents" ("folder_id")
      `);

            console.log('✅ Added folder_id column to documents table');
        } else {
            console.log('ℹ️ folder_id column already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_documents_folder_id"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN IF EXISTS "folder_id"`);
    }
}
