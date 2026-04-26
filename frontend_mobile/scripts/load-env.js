const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'local';
const sourceFile = path.join(__dirname, '..', `.env.${env}`);
const targetFile = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Environment file .env.${env} not found!`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✓ Loaded .env.${env} environment`);
} catch (error) {
  console.error(`Error copying environment file: ${error.message}`);
  process.exit(1);
}
