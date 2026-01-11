#!/usr/bin/env node

/**
 * Script de vérification de la configuration de déploiement
 * Vérifie que toutes les variables d'environnement nécessaires sont définies
 */

const chalk = require('chalk') || { green: (s) => s, red: (s) => s, yellow: (s) => s, blue: (s) => s };

// Variables d'environnement requises
const requiredEnvVars = {
  // Database
  DATABASE: [
    'DATABASE_URL',
    'NEON_DATABASE_URL_PRODUCTION',
  ],

  // JWT
  JWT: [
    'JWT_ACCESS_TOKEN_SECRET',
    'JWT_REFRESH_TOKEN_SECRET',
    'JWT_PASSWORD_RESET_SECRET',
  ],

  // Email
  EMAIL: [
    'SENDGRID_API_KEY',
    'MAIL_FROM',
  ],

  // AI/OCR
  AI: [
    'GEMINI_API_KEY',
  ],

  // Storage
  STORAGE: [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ],

  // Redis
  REDIS: [
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
  ],

  // General
  GENERAL: [
    'NODE_ENV',
  ],
};

// Variables optionnelles mais recommandées
const optionalEnvVars = [
  'FRONTEND_URL',
  'PORT',
  'BACKEND_PORT',
  'REDIS_TLS',
  'REDIS_DB',
  'CACHE_TTL',
  'CACHE_NAMESPACE',
];

// Validations personnalisées
const customValidations = {
  DATABASE_URL: (value) => {
    if (!value.includes('postgresql://')) {
      return 'La DATABASE_URL doit commencer par postgresql://';
    }
    if (!value.includes('sslmode=require')) {
      return 'La DATABASE_URL doit contenir ?sslmode=require pour la production';
    }
    return null;
  },

  JWT_ACCESS_TOKEN_SECRET: (value) => {
    if (value.length < 32) {
      return 'Le JWT_ACCESS_TOKEN_SECRET doit faire au moins 32 caractères';
    }
    return null;
  },

  JWT_REFRESH_TOKEN_SECRET: (value) => {
    if (value.length < 32) {
      return 'Le JWT_REFRESH_TOKEN_SECRET doit faire au moins 32 caractères';
    }
    return null;
  },

  JWT_PASSWORD_RESET_SECRET: (value) => {
    if (value.length < 32) {
      return 'Le JWT_PASSWORD_RESET_SECRET doit faire au moins 32 caractères';
    }
    return null;
  },

  NODE_ENV: (value) => {
    const validEnvs = ['development', 'staging', 'production', 'test'];
    if (!validEnvs.includes(value)) {
      return `NODE_ENV doit être l'un de: ${validEnvs.join(', ')}`;
    }
    return null;
  },

  SENDGRID_API_KEY: (value) => {
    if (!value.startsWith('SG.')) {
      return 'La SENDGRID_API_KEY doit commencer par SG.';
    }
    return null;
  },

  GEMINI_API_KEY: (value) => {
    if (!value.startsWith('AIza')) {
      return 'La GEMINI_API_KEY doit commencer par AIza';
    }
    return null;
  },

  REDIS_TLS: (value) => {
    if (value && !['true', 'false'].includes(value.toLowerCase())) {
      return 'REDIS_TLS doit être true ou false';
    }
    return null;
  },
};

function checkEnvironmentVariables() {
  console.log(chalk.blue('\n🔍 Vérification de la configuration de déploiement...\n'));

  let hasErrors = false;
  let hasWarnings = false;
  const errors = [];
  const warnings = [];

  // Vérification des variables requises
  Object.entries(requiredEnvVars).forEach(([category, vars]) => {
    console.log(chalk.blue(`\n📦 ${category}:`));

    // Pour DATABASE, on vérifie qu'au moins une variable est définie
    if (category === 'DATABASE') {
      const hasAnyDb = vars.some(varName => process.env[varName]);
      if (!hasAnyDb) {
        console.log(chalk.red(`  ✗ Aucune variable de base de données définie`));
        console.log(chalk.yellow(`    Au moins l'une de ces variables doit être définie:`));
        vars.forEach(varName => {
          console.log(chalk.yellow(`    - ${varName}`));
        });
        errors.push(`Aucune variable de base de données définie`);
        hasErrors = true;
      } else {
        vars.forEach(varName => {
          if (process.env[varName]) {
            console.log(chalk.green(`  ✓ ${varName}`));

            // Validation personnalisée
            if (customValidations[varName]) {
              const error = customValidations[varName](process.env[varName]);
              if (error) {
                console.log(chalk.red(`    ⚠ ${error}`));
                errors.push(`${varName}: ${error}`);
                hasErrors = true;
              }
            }
          }
        });
      }
      return;
    }

    // Pour les autres catégories, toutes les variables sont requises
    vars.forEach(varName => {
      const value = process.env[varName];

      if (!value) {
        console.log(chalk.red(`  ✗ ${varName} (manquant)`));
        errors.push(`${varName} est manquant`);
        hasErrors = true;
      } else {
        console.log(chalk.green(`  ✓ ${varName}`));

        // Validation personnalisée
        if (customValidations[varName]) {
          const error = customValidations[varName](value);
          if (error) {
            console.log(chalk.red(`    ⚠ ${error}`));
            errors.push(`${varName}: ${error}`);
            hasErrors = true;
          }
        }
      }
    });
  });

  // Vérification des variables optionnelles
  console.log(chalk.blue('\n\n📋 Variables optionnelles:'));
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];

    if (!value) {
      console.log(chalk.yellow(`  ! ${varName} (optionnel, non défini)`));
      warnings.push(`${varName} n'est pas défini (optionnel)`);
      hasWarnings = true;
    } else {
      console.log(chalk.green(`  ✓ ${varName}`));

      // Validation personnalisée
      if (customValidations[varName]) {
        const error = customValidations[varName](value);
        if (error) {
          console.log(chalk.yellow(`    ⚠ ${error}`));
          warnings.push(`${varName}: ${error}`);
          hasWarnings = true;
        }
      }
    }
  });

  // Résumé
  console.log(chalk.blue('\n\n' + '='.repeat(50)));
  console.log(chalk.blue('RÉSUMÉ'));
  console.log(chalk.blue('='.repeat(50) + '\n'));

  if (hasErrors) {
    console.log(chalk.red(`❌ ${errors.length} erreur(s) trouvée(s):`));
    errors.forEach(error => console.log(chalk.red(`   - ${error}`)));
  } else {
    console.log(chalk.green('✅ Toutes les variables requises sont correctement définies'));
  }

  if (hasWarnings) {
    console.log(chalk.yellow(`\n⚠️  ${warnings.length} avertissement(s):`));
    warnings.forEach(warning => console.log(chalk.yellow(`   - ${warning}`)));
  }

  console.log('\n');

  // Recommandations finales
  if (!hasErrors) {
    console.log(chalk.green('🎉 Votre configuration est prête pour le déploiement!\n'));
    console.log(chalk.blue('Prochaines étapes:'));
    console.log('  1. Commitez vos changements');
    console.log('  2. Pushez vers votre repository');
    console.log('  3. Déployez sur votre plateforme (Railway, Render, etc.)');
    console.log('  4. Exécutez les migrations: npm run migration:run');
    console.log('  5. Testez votre API: https://votre-url.com/api\n');
  } else {
    console.log(chalk.red('❌ Veuillez corriger les erreurs avant de déployer.\n'));
    process.exit(1);
  }
}

// Fonction pour générer des secrets JWT
function generateJwtSecrets() {
  console.log(chalk.blue('\n🔐 Génération de secrets JWT sécurisés...\n'));

  const crypto = require('crypto');

  console.log('Copiez ces secrets dans votre configuration:\n');
  console.log(chalk.green('JWT_ACCESS_TOKEN_SECRET=' + crypto.randomBytes(64).toString('hex')));
  console.log(chalk.green('JWT_REFRESH_TOKEN_SECRET=' + crypto.randomBytes(64).toString('hex')));
  console.log(chalk.green('JWT_PASSWORD_RESET_SECRET=' + crypto.randomBytes(64).toString('hex')));
  console.log('\n');
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--generate-secrets') || args.includes('-g')) {
  generateJwtSecrets();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node check-deployment-readiness.js [options]

Options:
  --generate-secrets, -g    Générer des secrets JWT sécurisés
  --help, -h               Afficher cette aide

Exemples:
  node check-deployment-readiness.js
  node check-deployment-readiness.js --generate-secrets
  `);
} else {
  checkEnvironmentVariables();
}
