// Script to add ALL missing columns to documents table
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env' });

const databaseUrl = process.env.NEON_DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in .env');
    process.exit(1);
}

async function addMissingColumns() {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Add ALL missing columns
        const columns = [
            { name: 'folder_id', type: 'uuid NULL' },
            { name: 'parsed_provider', type: 'varchar(255) NULL' },
            { name: 'parsed_amount', type: 'decimal(10,2) NULL' },
            { name: 'parsed_currency', type: 'varchar(3) NULL' },
            { name: 'parsed_date', type: 'date NULL' },
            { name: 'parsed_frequency', type: 'varchar(50) NULL' },
            { name: 'parsed_category', type: 'varchar(50) NULL' },
            { name: 'parsing_confidence', type: 'float NULL' },
        ];

        for (const col of columns) {
            try {
                await client.query(`
          ALTER TABLE "documents" 
          ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}
        `);
                console.log(`✅ Added column: ${col.name}`);
            } catch (err: any) {
                if (err.code === '42701') {
                    console.log(`ℹ️ Column ${col.name} already exists`);
                } else {
                    console.error(`❌ Error adding ${col.name}:`, err.message);
                }
            }
        }

        console.log('🎉 All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

addMissingColumns();
