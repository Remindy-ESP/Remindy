#!/usr/bin/env node

/**
 * Script to generate a JWT token for testing purposes
 * Usage: node scripts/generate-test-token.js [role] [userId]
 * Example: node scripts/generate-test-token.js premium 1
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Parse command line arguments
const role = process.argv[2] || 'premium';
const userId = process.argv[3] || '00000000-0000-0000-0000-000000000001';

// Validate role
const validRoles = ['free', 'premium', 'admin'];
if (!validRoles.includes(role)) {
  console.error(`❌ Invalid role: ${role}`);
  console.error(`   Valid roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

// JWT secret from environment or default
const jwtSecret = process.env.JWT_ACCESS_TOKEN_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRATION || '24h';

// Create payload
const payload = {
  sub: userId,
  email: `test-user-${userId}@example.com`,
  role: role,
  iat: Math.floor(Date.now() / 1000),
};

// Generate token
try {
  const token = jwt.sign(payload, jwtSecret, { expiresIn });

  console.log('\n✅ JWT Token Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Token Details:');
  console.log(`   User ID:  ${userId}`);
  console.log(`   Email:    ${payload.email}`);
  console.log(`   Role:     ${role}`);
  console.log(`   Expires:  ${expiresIn}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔑 Token:\n');
  console.log(token);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 Usage examples:\n');
  console.log('   Export as environment variable:');
  console.log(`   export TOKEN="${token}"\n`);

  console.log('   Use with curl:');
  console.log(`   curl -H "Authorization: Bearer ${token}" http://localhost:3000/documents\n`);

  console.log('   Use with httpie:');
  console.log(`   http GET localhost:3000/documents "Authorization: Bearer ${token}"\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Quota information
  const quotas = {
    free: { storage: '100 MB', documents: 50 },
    premium: { storage: '1 GB', documents: 500 },
    admin: { storage: '10 GB', documents: 10000 }
  };

  console.log(`📊 Quotas for role "${role}":`);
  console.log(`   Storage:   ${quotas[role].storage}`);
  console.log(`   Documents: ${quotas[role].documents}`);
  console.log('');

} catch (error) {
  console.error('❌ Error generating token:', error.message);
  process.exit(1);
}
