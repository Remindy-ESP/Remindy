const { config } = require('dotenv');
const path = require('path');
config({ path: path.resolve(__dirname, '../.env.develop') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL_DEV });

async function updateCategories() {
  try {
    // Update each category with French names and proper icons
    await pool.query(`UPDATE categories SET name='Streaming', icon='📺', color='#E50914' WHERE name='Streaming'`);
    await pool.query(`UPDATE categories SET name='Internet', icon='🌐', color='#4285F4' WHERE name='Internet'`);
    await pool.query(`UPDATE categories SET name='Mobile', icon='📱', color='#34A853' WHERE name='Mobile'`);
    await pool.query(`UPDATE categories SET name='Assurance', icon='🛡️', color='#0088CC' WHERE name='Insurance'`);
    await pool.query(`UPDATE categories SET name='Services Publics', icon='💡', color='#FBBC04' WHERE name='Utilities'`);
    await pool.query(`UPDATE categories SET name='Abonnements', icon='📋', color='#9C27B0' WHERE name='Subscriptions'`);
    await pool.query(`UPDATE categories SET name='Autre', icon='📦', color='#607D8B' WHERE name='Other'`);

    console.log('✓ Categories updated successfully');

    // Verify
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    console.log('\n=== Updated Categories ===');
    result.rows.forEach(c => console.log(`Name: ${c.name} | Icon: ${c.icon} | Color: ${c.color}`));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}

updateCategories();
