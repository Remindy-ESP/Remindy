// Script to add missing folder_id column
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env' });

const databaseUrl = process.env.NEON_DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in .env');
    process.exit(1);
}

async function addFolderIdColumn() {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Add folder_id column if it doesn't exist
        await client.query(`
      ALTER TABLE "documents" 
      ADD COLUMN IF NOT EXISTS "folder_id" uuid NULL
    `);
        console.log('✅ Added folder_id column');

        // Create index if it doesn't exist
        await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_documents_folder_id" 
      ON "documents" ("folder_id")
    `);
        console.log('✅ Created index on folder_id');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

addFolderIdColumn();
