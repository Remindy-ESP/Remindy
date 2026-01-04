// Script to verify document data in NeonDB
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env' });

const databaseUrl = process.env.NEON_DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in .env');
    process.exit(1);
}

const docId = 'a0ae87c8-8cdd-4946-9858-46989e42dd35';

async function verifyDocument() {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const res = await client.query('SELECT * FROM "documents" WHERE "id" = $1', [docId]);

        if (res.rows.length === 0) {
            console.log(`❌ Document with ID ${docId} not found`);
            return;
        }

        const doc = res.rows[0];
        console.log('📄 Document Data:');
        console.log(JSON.stringify(doc, null, 2));

        // Verify against ticket requirements (summary)
        const requiredFields = [
            'id', 'user_id', 'filename', 'r2_key', 'file_size', 'mime_type',
            'ocr_status', 'ocr_text', 'parsed_provider', 'parsed_amount',
            'parsed_currency', 'parsed_date', 'parsed_frequency', 'parsed_category',
            'parsing_confidence'
        ];

        console.log('\n📊 Schema Verification:');
        requiredFields.forEach(field => {
            const exists = field in doc;
            console.log(`${exists ? '✅' : '❌'} ${field}: ${exists ? (doc[field] !== null ? 'Populated' : 'Null') : 'Missing'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

verifyDocument();
