const { Client } = require('pg');
require('dotenv').config({ path: '.env.develop' });

async function createNotification() {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL_DEV,
  });

  try {
    await client.connect();
    console.log('Connecté à la base de données Neon...');

    // 1. Trouver l'utilisateur spécifique
    const userRes = await client.query("SELECT id FROM users WHERE email = 'rebeu@rebeu.com'");
    if (userRes.rows.length === 0) {
      console.log("L'utilisateur avec l'email 'rebeu@rebeu.com' n'a pas été trouvé.");
      return;
    }
    const userId = userRes.rows[0].id;
    console.log(`Utilisateur rebeu@rebeu.com trouvé : ${userId}`);

    // 2. Insérer une notification fictive non lue
    const query = `
      INSERT INTO notifications (
        id, user_id, type, channel, title, body, status, created_at, read_at
      ) VALUES (
        gen_random_uuid(), 
        $1, 
        'reminder', 
        'push', 
        '🔔 Alerte de test', 
        'Ceci est une notification de test générée par le script.', 
        'pending', 
        NOW(), 
        NULL
      ) RETURNING id;
    `;
    
    const notifRes = await client.query(query, [userId]);
    console.log(`✅ Notification créée avec succès ! ID: ${notifRes.rows[0].id}`);
    console.log('Tu peux maintenant actualiser la page frontend pour voir la notification.');

  } catch (err) {
    console.error('Erreur lors de la création de la notification:', err);
  } finally {
    await client.end();
  }
}

createNotification();