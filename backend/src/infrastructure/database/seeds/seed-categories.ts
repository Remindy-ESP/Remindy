import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.develop' });

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.NEON_DATABASE_URL_DEV,
  ssl: true,
});

async function seedCategories() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Define default system categories
    const defaultCategories = [
      { name: 'Work', icon: '💼', color: '#455A64' },
      { name: 'Streaming', icon: '📺', color: '#E50914' },
      { name: 'Internet', icon: '🌐', color: '#0066CC' },
      { name: 'Insurance', icon: '🛡️', color: '#2E7D32' },
      { name: 'Utilities', icon: '⚡', color: '#FFA000' },
      { name: 'Phone', icon: '📱', color: '#1976D2' },
      { name: 'Fitness', icon: '🏋️', color: '#F44336' },
      { name: 'News/Media', icon: '📰', color: '#424242' },
      { name: 'Software', icon: '💾', color: '#7B1FA2' },
      { name: 'Gaming', icon: '🎮', color: '#00C853' },
      { name: 'Music', icon: '🎵', color: '#FF6F00' },
      { name: 'Education', icon: '📚', color: '#1E88E5' },
      { name: 'Transportation', icon: '🚗', color: '#6D4C41' },
      { name: 'Business', icon: '💼', color: '#455A64' },
      { name: 'Home Services', icon: '🏠', color: '#00897B' },
    ];

    let insertedCount = 0;
    let skippedCount = 0;

    for (const category of defaultCategories) {
      // Check if category already exists
      const existing = await dataSource.query(
        'SELECT id FROM categories WHERE name = $1 AND is_system = true',
        [category.name],
      );

      if (existing.length === 0) {
        // Insert category
        await dataSource.query(
          'INSERT INTO categories (name, icon, color, user_id, is_system) VALUES ($1, $2, $3, NULL, true)',
          [category.name, category.icon, category.color],
        );
        console.log(`  ✓ Added: ${category.icon} ${category.name}`);
        insertedCount++;
      } else {
        console.log(`  ⊗ Skipped: ${category.icon} ${category.name} (already exists)`);
        skippedCount++;
      }
    }

    console.log(`\n✅ Categories seed complete:`);
    console.log(`   - ${insertedCount} categories added`);
    console.log(`   - ${skippedCount} categories skipped`);

    // Verify
    const categories = await dataSource.query(
      'SELECT * FROM categories WHERE is_system = true ORDER BY name',
    );
    console.log(`\n📊 Total system categories: ${categories.length}`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories().catch(error => {
  console.error('Failed to seed categories:', error);
  process.exit(1);
});
