#!/usr/bin/env node

/**
 * Script de vérification avant build EAS
 * Vérifie que tous les prérequis sont remplis
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(condition, successMsg, errorMsg) {
  if (condition) {
    log(`✅ ${successMsg}`, 'green');
    return true;
  } else {
    log(`❌ ${errorMsg}`, 'red');
    return false;
  }
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function section(title) {
  console.log();
  log(`${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'bold');
  log(`${'='.repeat(60)}`, 'cyan');
  console.log();
}

async function main() {
  let allChecksPass = true;
  const warnings = [];

  section('🔍 Vérification de la Configuration EAS');

  // Vérifier eas.json
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  const easJsonExists = fs.existsSync(easJsonPath);
  allChecksPass &= check(
    easJsonExists,
    'eas.json existe',
    'eas.json manquant - Exécutez: eas build:configure'
  );

  if (easJsonExists) {
    const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    allChecksPass &= check(
      easJson.build && easJson.build.production,
      'Profil production configuré',
      'Profil production manquant dans eas.json'
    );

    allChecksPass &= check(
      easJson.build && easJson.build.preview,
      'Profil preview configuré',
      'Profil preview manquant dans eas.json'
    );
  }

  // Vérifier app.json
  section('📱 Vérification de app.json');

  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJsonExists = fs.existsSync(appJsonPath);
  allChecksPass &= check(
    appJsonExists,
    'app.json existe',
    'app.json manquant'
  );

  if (appJsonExists) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appJson.expo;

    // Vérifier nom et slug
    allChecksPass &= check(
      expo.name && expo.name !== 'frontend_mobile',
      `Nom de l'app: ${expo.name}`,
      'Nom de l\'app non configuré (encore "frontend_mobile")'
    );

    allChecksPass &= check(
      expo.slug && expo.slug !== 'frontend_mobile',
      `Slug: ${expo.slug}`,
      'Slug non configuré (encore "frontend_mobile")'
    );

    // Vérifier version
    allChecksPass &= check(
      expo.version,
      `Version: ${expo.version}`,
      'Version manquante'
    );

    // Vérifier iOS
    if (expo.ios) {
      allChecksPass &= check(
        expo.ios.bundleIdentifier && expo.ios.bundleIdentifier !== 'com.example.app',
        `iOS Bundle ID: ${expo.ios.bundleIdentifier}`,
        'iOS bundleIdentifier non configuré'
      );

      allChecksPass &= check(
        expo.ios.buildNumber,
        `iOS Build Number: ${expo.ios.buildNumber}`,
        'iOS buildNumber manquant'
      );
    } else {
      warn('Configuration iOS manquante');
      warnings.push('Ajoutez la configuration iOS dans app.json');
    }

    // Vérifier Android
    if (expo.android) {
      allChecksPass &= check(
        expo.android.package && expo.android.package !== 'com.example.app',
        `Android Package: ${expo.android.package}`,
        'Android package non configuré'
      );

      allChecksPass &= check(
        expo.android.versionCode,
        `Android Version Code: ${expo.android.versionCode}`,
        'Android versionCode manquant'
      );
    } else {
      warn('Configuration Android manquante');
      warnings.push('Ajoutez la configuration Android dans app.json');
    }

    // Vérifier Project ID
    allChecksPass &= check(
      expo.extra && expo.extra.eas && expo.extra.eas.projectId,
      `Project ID: ${expo.extra?.eas?.projectId}`,
      'EAS Project ID manquant'
    );
  }

  // Vérifier assets
  section('🎨 Vérification des Assets');

  const iconPath = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
  allChecksPass &= check(
    fs.existsSync(iconPath),
    'Icon trouvé (assets/images/icon.png)',
    'Icon manquant - Créez assets/images/icon.png (1024x1024)'
  );

  const splashPath = path.join(__dirname, '..', 'assets', 'images', 'splash-icon.png');
  allChecksPass &= check(
    fs.existsSync(splashPath),
    'Splash screen trouvé',
    'Splash screen manquant - Créez assets/images/splash-icon.png'
  );

  const adaptiveIconPath = path.join(__dirname, '..', 'assets', 'images', 'adaptive-icon.png');
  allChecksPass &= check(
    fs.existsSync(adaptiveIconPath),
    'Adaptive icon trouvé (Android)',
    'Adaptive icon manquant - Créez assets/images/adaptive-icon.png (1024x1024)'
  );

  // Vérifier dépendances
  section('📦 Vérification des Dépendances');

  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  allChecksPass &= check(
    packageJson.dependencies.expo,
    `Expo SDK: ${packageJson.dependencies.expo}`,
    'Expo SDK manquant'
  );

  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  allChecksPass &= check(
    fs.existsSync(nodeModulesPath),
    'node_modules installé',
    'node_modules manquant - Exécutez: npm install'
  );

  // Vérifier .easignore
  section('📝 Fichiers de Configuration');

  const easIgnorePath = path.join(__dirname, '..', '.easignore');
  if (fs.existsSync(easIgnorePath)) {
    log('✅ .easignore trouvé', 'green');
  } else {
    warn('.easignore manquant (recommandé pour optimiser la taille du build)');
    warnings.push('Créez .easignore pour exclure les fichiers inutiles');
  }

  // Vérifier variables d'environnement
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    log('✅ .env.example trouvé', 'green');
  } else {
    warn('.env.example manquant (recommandé)');
  }

  const envPath = path.join(__dirname, '..', '.env.production');
  if (fs.existsSync(envPath)) {
    log('✅ .env.production trouvé', 'green');
  } else {
    warn('.env.production manquant (recommandé pour production)');
    warnings.push('Créez .env.production avec vos variables de production');
  }

  // Résumé
  section('📊 Résumé');

  if (allChecksPass) {
    log('🎉 Toutes les vérifications sont passées !', 'green');
    console.log();
    log('Vous êtes prêt à lancer votre premier build:', 'cyan');
    console.log();
    log('  Preview (Android):     eas build --platform android --profile preview', 'bold');
    log('  Production (All):      eas build --platform all --profile production', 'bold');
    console.log();
  } else {
    log('❌ Certaines vérifications ont échoué', 'red');
    console.log();
    log('Corrigez les erreurs ci-dessus avant de lancer le build.', 'yellow');
    console.log();
  }

  if (warnings.length > 0) {
    log('⚠️  Avertissements:', 'yellow');
    warnings.forEach((w) => {
      log(`   - ${w}`, 'yellow');
    });
    console.log();
  }

  // Checklist interactive
  section('✅ Checklist Finale');

  console.log('Avant de lancer le build, assurez-vous que:');
  console.log();
  console.log('  [ ] EAS CLI est installé:     npm install -g eas-cli');
  console.log('  [ ] Vous êtes connecté:       eas login');
  console.log('  [ ] L\'app compile localement:  npm start');
  console.log('  [ ] Les tests passent:        npm test');
  console.log('  [ ] Pas d\'erreurs TypeScript: npm run lint');
  console.log();

  if (!allChecksPass) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Erreur lors de la vérification:', error);
  process.exit(1);
});
