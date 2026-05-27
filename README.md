# Remindy

Application de gestion de rappels et de documents — backend NestJS, mobile React Native/Expo.

## Structure du projet

```
Remindy/
├── backend/           # API NestJS (port 3000)
├── frontend_mobile/   # Application mobile React Native (Expo)
└── frontend_admin/    # Dashboard admin React + Vite
```

---

## Prérequis

- Node.js v18+
- npm
- [ngrok](https://ngrok.com) avec un domaine statique gratuit (obligatoire pour OAuth Google et développement sur téléphone physique)
- Android Studio + émulateur **ou** téléphone Android avec débogage USB/WiFi activé

---

## Setup rapide (Makefile)

```bash
make setup        # Détecte l'IP locale et génère frontend_mobile/.env.local
make dev-backend  # Lance NestJS en watch mode
make dev-mobile   # Lance Expo
make dev-admin    # Lance Vite (admin)
make migrate      # Applique les migrations TypeORM

# Windows uniquement (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1
```

---

## Backend

### Configuration — `.env.develop`

Copiez `.env.exemple` → `.env.develop` et remplissez les valeurs :

```env
# Base de données (Neon PostgreSQL)
NEON_DATABASE_URL_DEV=postgresql://user:password@host/database
NEON_DATABASE_URL_TEST=postgresql://user:password@host/test_database
NEON_DATABASE_URL_STAGING=postgresql://user:password@host/staging_database
NEON_DATABASE_URL_PROD=postgresql://user:password@host/prod_database

NODE_ENV=development

# JWT
JWT_ACCESS_TOKEN_SECRET=un_secret_access_bien_random
JWT_REFRESH_TOKEN_SECRET=un_secret_refresh_bien_random
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d
JWT_PASSWORD_RESET_SECRET=un_secret_reset_bien_random
MFA_SECRET_KEY=un_secret_mfa_bien_random

# Email (Brevo / ancien SendGrid)
SENDGRID_API_KEY=votre_cle_brevo
MAIL_FROM=noreply@votredomaine.com

# Cloudflare R2 (stockage fichiers)
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key_id
R2_SECRET_ACCESS_KEY=votre_secret_access_key
R2_BUCKET_NAME=nom_du_bucket

# IA
GEMINI_API_KEY=votre_cle_gemini

# URLs — utilisez votre domaine ngrok statique
FRONTEND_URL=http://localhost:5173
BACKEND_URL=https://votre-domaine.ngrok-free.dev
FRONTEND_PASSWORD_RESET_URL=https://votre-domaine.ngrok-free.dev/auth/password-reset-redirect

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_secret_google
GOOGLE_MOBILE_CALLBACK_URL=https://votre-domaine.ngrok-free.dev/auth/oauth/google/mobile/callback
```

### Lancer le backend

```bash
cd backend
npm install
npm run start:dev   # http://localhost:3000
                    # Swagger : http://localhost:3000/swagger/v1
```

### Exposer le backend via ngrok (obligatoire pour OAuth + téléphone physique)

```bash
ngrok http --domain=votre-domaine.ngrok-free.dev 3000
```

> Le domaine statique gratuit se crée sur [dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains).
> Une fois créé, il ne change jamais — plus besoin de mettre à jour Google Cloud Console.

---

## Frontend Mobile

### Configuration — `.env.local`

Copiez `.env.exemple` → `.env.local` (ignoré par git) :

```env
EXPO_PUBLIC_BACKEND_API_URL=https://votre-domaine.ngrok-free.dev
EXPO_PUBLIC_BACKEND_API_TIMEOUT=30000
EXPO_PUBLIC_ENV=local

# Google OAuth (IDs depuis Google Cloud Console)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com
```

> **Pourquoi ngrok et pas l'IP locale ?**
> L'IP change à chaque connexion réseau. ngrok donne une URL HTTPS fixe, indispensable pour Google OAuth.

### Lancer l'application

```bash
cd frontend_mobile
npm install

npm start              # Expo dev server (scan QR avec Expo Go)
npx expo run:android   # Build natif Android (nécessite Android Studio ou téléphone connecté)
npx expo run:ios       # Build natif iOS (macOS uniquement)
```

> `npx expo run:android` régénère le dossier `android/` si besoin. Ce dossier est ignoré par git car entièrement auto-généré.

---

## Connecter un téléphone Android en débogage WiFi

### Android 11 et supérieur (méthode recommandée)

L'ancienne méthode `adb connect <ip>:5555` **ne fonctionne plus** directement sur Android 11+.  
Il faut passer par le "Débogage sans fil" avec un code de jumelage :

1. **Activer le mode développeur** : Réglages → À propos → appuyer 7× sur "Numéro de build"
2. **Activer le débogage sans fil** : Réglages → Système → Options pour les développeurs → Débogage sans fil → activer
3. **Jumeler l'appareil** : dans "Débogage sans fil", appuyer sur **"Jumeler l'appareil avec un code"**
   - Un code à 6 chiffres et un port de jumelage s'affichent (ex: `192.168.1.x:37000`, code `123456`)
4. Sur le PC :
   ```bash
   adb pair 192.168.1.x:37000
   # Entrer le code à 6 chiffres quand demandé
   ```
5. Une fois jumelé, récupérer le **port de connexion** affiché dans "Débogage sans fil" (différent du port de jumelage) :
   ```bash
   adb connect 192.168.1.x:PORT_CONNEXION
   ```
6. Vérifier que le téléphone est reconnu :
   ```bash
   adb devices
   # doit afficher votre appareil avec "device"
   ```

### Android 10 et inférieur

```bash
# Avec câble USB branché :
adb tcpip 5555
adb connect 192.168.1.x:5555
# Débrancher le câble, le téléphone reste connecté
```

---

## Commandes utiles

### Backend

```bash
cd backend

npm run start:dev          # Dev (watch mode)
npm run build              # Compilation TypeScript
npm run lint               # ESLint auto-fix
npm run format             # Prettier
npm run test               # Tests unitaires
npm run test:watch         # Jest watch
npm run test:cov           # Couverture
npm run test:e2e           # Tests end-to-end

# Migrations TypeORM
npm run migration:generate -- -n NomDeLaMigration
npm run migration:run
npm run migration:revert
npm run migration:show
```

### Frontend Mobile

```bash
cd frontend_mobile

npm start                  # Expo dev server
npm run android            # Android (émulateur/device)
npm run ios                # iOS (macOS uniquement)
npm run start:staging      # Config staging
npm run start:prod         # Config production
npm run lint               # ESLint
npm run test               # Jest
npm run test:watch         # Jest watch
npm run test:coverage      # Couverture
```

---

## Avant de créer une Pull Request

```bash
# Backend
cd backend && npm run format && npm run lint && npm run test && npm run build

# Mobile
cd frontend_mobile && npm run lint && npm run test
```

> La CI lance ces vérifications automatiquement sur chaque PR vers `develop`.

---

## Architecture

### Backend — Clean Architecture (4 couches)

```
Presentation  →  Application  →  Domain  →  Infrastructure
(Controller)     (UseCase)       (Entity)    (TypeORM / APIs)
```

17 modules : `auth`, `user`, `subscription`, `roles`, `audit`, `event`, `event-series`,
`reminder`, `category`, `folder`, `document`, `storage`, `notification`, `admin`,
`support`, `scheduler`, `seed`, `budgets`, `statistics`.

### Frontend Mobile — Expo Router (file-based routing)

```
app/           # Pages (routing automatique)
features/      # Modules fonctionnels (components + hooks + api)
components/    # Composants partagés
services/api/  # Couche HTTP (axios)
context/       # Auth, i18n
hooks/         # Hooks personnalisés
utils/         # Helpers
```

---

## Branche et CI/CD

```
feature/* → develop → preprod → master
```

- Toutes les PRs ciblent `develop`
- CI sur PR : lint + build (~3-5 min)
- CI sur develop→preprod : lint + build + tests + migrations (~10-15 min)
- Swagger disponible sur `http://localhost:3000/swagger/v1` en local
