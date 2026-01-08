// Load environment variables before running e2e tests
import * as dotenv from 'dotenv';
import { join } from 'path';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Load .env file from backend root
dotenv.config({ path: join(__dirname, '..', '.env') });

// Set test timeout globally
jest.setTimeout(30000);

// Log pour vérifier que les variables sont chargées
console.log('🧪 E2E Tests - Environment Setup');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? '✓ Set' : '✗ Missing');
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? '✓ Set' : '✗ Missing');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Missing');
console.log('DATABASE_URL:', process.env.NEON_DATABASE_URL_TEST || process.env.NEON_DATABASE_URL_DEV ? '✓ Set' : '✗ Missing');
console.log('---');
