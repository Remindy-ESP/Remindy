# 📱 Guide de Déploiement Mobile - Remindy

Guide complet pour déployer votre application React Native Expo sur iOS App Store et Google Play Store avec EAS (Expo Application Services).

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration EAS](#configuration-eas)
3. [Build Android](#build-android)
4. [Build iOS](#build-ios)
5. [Soumission aux Stores](#soumission-aux-stores)
6. [Over-The-Air Updates (OTA)](#over-the-air-updates)
7. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
8. [Troubleshooting](#troubleshooting)

---

## 1. Prérequis

### Comptes Requis

#### ✅ Compte Expo
- [x] Déjà configuré (owner: "remindy")
- [x] Project ID: `61a2fe01-d930-42dc-b161-03ea22e9dac8`

#### ⏳ Compte Google Play Console
- [ ] Créer un compte développeur Google Play ($25 one-time)
- [ ] URL: https://play.google.com/console/signup

#### ⏳ Compte Apple Developer
- [ ] Créer un compte Apple Developer ($99/an)
- [ ] URL: https://developer.apple.com/programs/

### Outils à Installer

```bash
# 1. Installer EAS CLI globalement
npm install -g eas-cli

# 2. Vérifier l'installation
eas --version

# 3. Se connecter à Expo
eas login
```

**Login** :
- Email: Votre email Expo
- Password: Votre mot de passe

---

## 2. Configuration EAS

### 2.1 Initialiser EAS

```bash
cd frontend_mobile

# Initialiser EAS (créera eas.json)
eas build:configure
```

Cette commande va :
- ✅ Créer `eas.json` avec la configuration par défaut
- ✅ Lier votre projet au projectId existant
- ✅ Configurer les profils de build

### 2.2 Structure de eas.json

Le fichier `eas.json` définit vos profils de build :

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "API_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_ENV": "staging"
      }
    },
    "production": {
      "env": {
        "API_ENV": "production"
      },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### 2.3 Configuration app.json

Votre `app.json` nécessite quelques ajustements :

**Modifications requises** :

```json
{
  "expo": {
    "name": "Remindy",
    "slug": "remindy",
    "version": "1.0.0",
    "scheme": "remindy",

    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.remindy.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Cette application a besoin d'accéder à votre caméra pour scanner les documents.",
        "NSPhotoLibraryUsageDescription": "Cette application a besoin d'accéder à vos photos pour télécharger des documents."
      }
    },

    "android": {
      "package": "com.remindy.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },

    "extra": {
      "eas": {
        "projectId": "61a2fe01-d930-42dc-b161-03ea22e9dac8"
      }
    }
  }
}
```

### 2.4 Variables d'Environnement

Créez `.env.development`, `.env.staging`, `.env.production` :

```bash
# .env.production
API_URL=https://api.remindy.app
API_TIMEOUT=30000
SENTRY_DSN=https://your-sentry-dsn
ENVIRONMENT=production
```

**Important** : Ajoutez `.env.*` à `.gitignore` !

---

## 3. Build Android

### 3.1 Premier Build Android

```bash
cd frontend_mobile

# Build de développement (pour tester)
eas build --platform android --profile development

# Build de preview (pour testeurs)
eas build --platform android --profile preview

# Build de production (pour le Play Store)
eas build --platform android --profile production
```

**Pendant le build**, EAS va vous demander :

1. **Generate a new keystore?** → `Yes` (première fois)
2. **Do you want to automatically increment...?** → `Yes`

### 3.2 Durée et Suivi

- ⏱️ **Durée** : 10-20 minutes
- 📊 **Suivi** : https://expo.dev/accounts/remindy/projects/remindy/builds

### 3.3 Télécharger l'APK/AAB

Une fois le build terminé :

```bash
# Télécharger le fichier
# Option 1 : Via le dashboard Expo
# → https://expo.dev/accounts/remindy/projects/remindy/builds
# → Cliquer sur "Download"

# Option 2 : Via CLI
eas build:list
# Copier l'ID du build
eas build:download [BUILD_ID]
```

**Résultat** :
- **Development** : APK (installable sur appareil)
- **Preview** : AAB (Android App Bundle)
- **Production** : AAB (pour Google Play)

### 3.4 Tester l'APK

```bash
# Installer sur appareil Android connecté
adb install app-release.apk

# OU envoyer par email/lien
# L'APK peut être installé directement sur Android
```

---

## 4. Build iOS

### 4.1 Prérequis iOS

1. **Compte Apple Developer** ($99/an)
2. **macOS avec Xcode** (optionnel - EAS peut tout gérer)
3. **App Store Connect App** créée

### 4.2 Créer l'App dans App Store Connect

1. Allez sur https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Remplir :
   - **Platform** : iOS
   - **Name** : Remindy
   - **Primary Language** : French
   - **Bundle ID** : `com.remindy.app`
   - **SKU** : `remindy-app-2026`

### 4.3 Premier Build iOS

```bash
cd frontend_mobile

# Build de développement
eas build --platform ios --profile development

# Build de production
eas build --platform ios --profile production
```

**EAS va vous demander** :

1. **Apple ID** : Votre email Apple Developer
2. **Password** : Mot de passe Apple
3. **App-specific password** : Créer sur https://appleid.apple.com
4. **Apple Team ID** : Trouvé dans Membership (ex: ABCD123456)

**EAS gérera automatiquement** :
- ✅ Certificats de distribution
- ✅ Provisioning profiles
- ✅ App Store Connect API Key

### 4.4 Télécharger l'IPA

```bash
# Via dashboard
https://expo.dev/accounts/remindy/projects/remindy/builds

# Via CLI
eas build:download [BUILD_ID]
```

---

## 5. Soumission aux Stores

### 5.1 Google Play Store

#### Étape 1 : Créer l'Application

1. **Play Console** : https://play.google.com/console
2. **Create app**
   - **App name** : Remindy
   - **Default language** : French
   - **App or game** : App
   - **Free or paid** : Free

#### Étape 2 : Configuration de Base

**Store listing** :
- **App name** : Remindy
- **Short description** : Gérez vos abonnements et rappels
- **Full description** : [Texte marketing complet]
- **App icon** : 512x512 PNG
- **Screenshots** : Minimum 2 (phone + tablet)
- **Feature graphic** : 1024x500

**App content** :
- Privacy policy : Requis !
- Target audience : 13+ ans
- Content rating : Obtenir via questionnaire

#### Étape 3 : Soumission Automatique avec EAS

```bash
# 1. Créer un Service Account Google Cloud
# → https://console.cloud.google.com
# → IAM & Admin → Service Accounts → Create Service Account
# → Download JSON key

# 2. Placer le JSON dans le projet
mkdir -p frontend_mobile/secrets
mv ~/Downloads/google-play-key.json frontend_mobile/secrets/google-play-service-account.json

# 3. Configurer dans eas.json (déjà fait)

# 4. Soumettre
eas submit --platform android --latest
```

**Options de track** :
- `internal` : Tests internes (jusqu'à 100 testeurs)
- `alpha` : Alpha testing
- `beta` : Beta testing (public ou fermé)
- `production` : Production

#### Étape 4 : Première Soumission Manuelle

Pour le **tout premier upload**, vous devez le faire manuellement :

```bash
# 1. Télécharger l'AAB depuis EAS
eas build:download [BUILD_ID]

# 2. Aller sur Play Console
# → Production → Create new release
# → Upload l'AAB
# → Fill release notes
# → Review et Submit
```

Après la première soumission, EAS peut tout automatiser !

---

### 5.2 Apple App Store

#### Étape 1 : App Store Connect

1. https://appstoreconnect.apple.com
2. **My Apps** → Votre app **Remindy**
3. **App Information** :
   - Name : Remindy
   - Subtitle : Gérez vos abonnements
   - Category : Productivity
   - Privacy Policy URL : https://remindy.app/privacy

#### Étape 2 : Préparer les Assets

**Screenshots requis** :
- iPhone 6.7" (1290 x 2796) : 3-10 images
- iPhone 6.5" (1242 x 2688) : 3-10 images
- iPad Pro 12.9" (2048 x 2732) : 3-10 images (optionnel)

**App Preview** (optionnel) :
- Vidéo 15-30 secondes

#### Étape 3 : Informations de Version

- **Version** : 1.0.0
- **Copyright** : 2026 Remindy
- **Age Rating** : 4+ (No Objectionable Content)
- **Description** : [Texte marketing]
- **Keywords** : subscription, reminder, bills, finance
- **Support URL** : https://remindy.app/support
- **Marketing URL** : https://remindy.app

#### Étape 4 : Soumission avec EAS

```bash
# Soumettre automatiquement
eas submit --platform ios --latest

# OU avec un build spécifique
eas submit --platform ios --id [BUILD_ID]
```

**EAS va** :
1. ✅ Uploader l'IPA sur App Store Connect
2. ✅ Lier la build à la version
3. ✅ Préparer pour review

#### Étape 5 : Soumettre pour Review

1. Dans App Store Connect
2. **App Store** → **Version** → **Submit for Review**
3. Répondre aux questions :
   - Uses encryption? → No (sauf si crypto custom)
   - Advertising identifier? → No
   - Third-party content? → No

**Délai de review** : 24-48h en moyenne

---

## 6. Over-The-Air Updates (OTA)

### 6.1 Configuration expo-updates

```bash
cd frontend_mobile
npx expo install expo-updates
```

### 6.2 Publier une Update

```bash
# Update de développement
eas update --branch development --message "Fix login bug"

# Update de production
eas update --branch production --message "New feature: dark mode"
```

### 6.3 Channels et Branches

Dans `eas.json`, ajoutez :

```json
{
  "build": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

**Workflow** :
1. Build app avec channel "production"
2. Publier updates sur branch "production"
3. Les utilisateurs reçoivent l'update au prochain lancement

**Limitations OTA** :
- ✅ Code JavaScript/TypeScript
- ✅ Assets (images, fonts)
- ❌ Code natif (plugins Expo, native modules)
- ❌ `app.json` (version, permissions)

---

## 7. CI/CD avec GitHub Actions

### 7.1 Créer .github/workflows/eas-build.yml

```yaml
name: EAS Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build on EAS
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend_mobile/package-lock.json

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: |
          cd frontend_mobile
          npm ci

      - name: Build Android Preview
        if: github.ref == 'refs/heads/develop'
        run: |
          cd frontend_mobile
          eas build --platform android --profile preview --non-interactive --no-wait

      - name: Build iOS & Android Production
        if: github.ref == 'refs/heads/main'
        run: |
          cd frontend_mobile
          eas build --platform all --profile production --non-interactive --no-wait
```

### 7.2 Secrets GitHub

Ajoutez dans **Settings** → **Secrets** :

```bash
EXPO_TOKEN=<votre-token>
```

**Obtenir le token** :
```bash
eas login
eas whoami
# Créer un token dans https://expo.dev/accounts/[username]/settings/access-tokens
```

---

## 8. Troubleshooting

### Erreur : "Keystore not found"

```bash
# Lister les credentials
eas credentials

# Configurer manuellement
eas credentials -p android
```

### Erreur : "Bundle identifier already in use"

Changez `bundleIdentifier` dans `app.json` :
```json
{
  "ios": {
    "bundleIdentifier": "com.remindy.app.new"
  }
}
```

### Build qui échoue

```bash
# Voir les logs détaillés
eas build:list
eas build:view [BUILD_ID]

# Re-run le build
eas build --platform android --profile production --clear-cache
```

### App rejetée par Apple

**Raisons communes** :
- Crash au lancement
- Permissions non justifiées
- Contenu manquant
- Métadonnées incorrectes

**Solution** :
1. Lire le rejection email
2. Corriger le problème
3. Re-soumettre

---

## 📝 Checklist de Déploiement

### Avant le Premier Build

- [ ] Compte Expo configuré
- [ ] EAS CLI installé (`npm install -g eas-cli`)
- [ ] Login EAS (`eas login`)
- [ ] `eas.json` créé
- [ ] `app.json` mis à jour (bundleIdentifier, package)
- [ ] Assets (icon, splash) optimisés
- [ ] Variables d'environnement configurées

### Android

- [ ] Compte Google Play Console créé ($25)
- [ ] Service Account JSON téléchargé
- [ ] App créée dans Play Console
- [ ] Store listing rempli (description, screenshots)
- [ ] Content rating obtenu
- [ ] Privacy policy publiée
- [ ] Build EAS réussi
- [ ] AAB uploadé (manuel ou EAS submit)

### iOS

- [ ] Compte Apple Developer créé ($99/an)
- [ ] App créée dans App Store Connect
- [ ] Bundle ID enregistré
- [ ] App Store listing rempli
- [ ] Screenshots créés (toutes tailles)
- [ ] Privacy policy publiée
- [ ] Build EAS réussi
- [ ] IPA uploadé (EAS submit)
- [ ] Soumis pour review

### Post-Lancement

- [ ] OTA updates configuré
- [ ] CI/CD GitHub Actions setup
- [ ] Monitoring (Sentry, Analytics)
- [ ] Stratégie de versioning définie
- [ ] Plan de rollout (internal → beta → production)

---

## 🎯 Timeline Estimé

| Étape | Durée |
|-------|-------|
| Configuration EAS | 30 min |
| Premier build Android | 2 heures |
| Premier build iOS | 3 heures |
| Play Console setup | 1-2 heures |
| App Store Connect setup | 2-3 heures |
| Review Google Play | 1-3 jours |
| Review App Store | 1-2 jours |
| **TOTAL** | **~1 semaine** |

---

## 💰 Coûts

| Service | Prix |
|---------|------|
| **Expo EAS** | Gratuit (1 build/mois) ou $29/mois (illimité) |
| **Google Play Console** | $25 (one-time) |
| **Apple Developer** | $99/an |
| **Total première année** | **$124 - $472** |

---

## 📚 Ressources

- **EAS Documentation** : https://docs.expo.dev/eas/
- **EAS Build** : https://docs.expo.dev/build/introduction/
- **EAS Submit** : https://docs.expo.dev/submit/introduction/
- **Play Console** : https://support.google.com/googleplay/android-developer/
- **App Store Connect** : https://developer.apple.com/app-store-connect/

---

## 🎉 Prochaines Étapes

1. **Lire ce guide en entier**
2. **Créer les comptes nécessaires** (Play Console, Apple Developer)
3. **Configurer `eas.json`** (fichier fourni ci-dessous)
4. **Lancer le premier build** : `eas build --platform android --profile preview`
5. **Tester l'app** sur appareil physique
6. **Préparer les assets** (screenshots, descriptions)
7. **Soumettre aux stores** !

Besoin d'aide ? Consultez `MOBILE_DEPLOYMENT_QUICKSTART.md` pour un guide rapide !
