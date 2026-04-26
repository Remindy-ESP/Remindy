import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.develop' });

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.NEON_DATABASE_URL_DEV,
  ssl: true,
});

async function seedRoles() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Insert default roles
    await dataSource.query(`
      INSERT INTO roles (key, label, description) VALUES
      ('user_freemium', 'User Freemium', 'Free tier user with limited features'),
      ('user_premium', 'User Premium', 'Premium tier user with all features'),
      ('user_admin', 'User Admin', 'Administrator with full access'),
      ('super_admin', 'Super Admin', 'Super administrator with system access')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('✅ Roles seeded successfully');

    // Verify
    const roles = await dataSource.query('SELECT * FROM roles');
    console.log('Roles in database:', roles);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles().catch(error => {
  console.error('Failed to seed roles:', error);
  process.exit(1);
});
