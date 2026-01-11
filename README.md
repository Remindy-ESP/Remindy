# Remindy

Application de gestion de rappels avec backend NestJS et application mobile React Native.

## Structure du projet

```
remindy_personal/
├── backend/           # API NestJS
├── frontend_mobile/   # Application mobile React Native (Expo)
└── frontend_admin/    # Interface d'administration (à venir)
```

## Prérequis

- Node.js (v18 ou supérieur)
- npm
- Pour le développement mobile : Expo Go sur votre téléphone ou émulateur Android/iOS

## Installation

### 1. Backend

```bash
cd backend
npm install
```

#### Configuration Backend (.env)

Créez un fichier `.env.develop` dans le dossier `backend/` avec les variables suivantes :

```env
# Database
NEON_DATABASE_URL_DEV=postgresql://user:password@host/database
NEON_DATABASE_URL_TEST=postgresql://user:password@host/test_database
NODE_ENV=development

# Server
BACKEND_PORT=3000

# JWT
JWT_ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d
JWT_PASSWORD_RESET_SECRET=your_password_reset_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
MAIL_FROM=your_email@example.com

# Frontend URL (pour les emails)
FRONTEND_URL=http://localhost:5173
```

#### Démarrer le backend

```bash
cd backend
npm run start:dev
```

Le backend sera accessible sur `http://localhost:3000`

### 2. Frontend Mobile

```bash
cd frontend_mobile
npm install
```

#### Configuration Frontend Mobile (.env)

Créez un fichier `.env.local` dans le dossier `frontend_mobile/` :

```env
# Pour un téléphone physique, utilisez l'IP locale de votre PC
# Trouvez votre IP : Windows (ipconfig), Mac/Linux (ifconfig)
EXPO_PUBLIC_BACKEND_API_URL=http://192.168.x.x:3000
EXPO_PUBLIC_BACKEND_API_TIMEOUT=30000
EXPO_PUBLIC_ENV=local
```

**Note importante :** Pour que votre téléphone puisse se connecter au backend :
1. Votre PC et votre téléphone doivent être sur le même réseau WiFi
2. Remplacez `192.168.x.x` par l'IP locale de votre PC
3. Configurez le firewall Windows pour autoriser le port 3000 (voir section Firewall ci-dessous)

#### Fichiers d'environnement disponibles

- `.env` - Valeurs par défaut (commité dans git)
- `.env.local` - **Développement local** (ignoré par git) - votre config personnelle
- `.env.development` - Configuration development (commité dans git)
- `.env.staging` - Configuration staging (commité dans git)
- `.env.production` - Configuration production (commité dans git)

**Ordre de priorité Expo** (du moins prioritaire au plus prioritaire) :
1. `.env`
2. `.env.development` (en mode development)
3. `.env.local` (toujours chargé en dernier, écrase tout)

#### Démarrer l'application mobile

```bash
cd frontend_mobile

# Développement local (par défaut)
npm start

# Avec staging
npm run start:staging

# Avec production
npm run start:prod
```

Scannez le QR code avec l'application Expo Go.

#### Configuration Firewall Windows (pour développement mobile)

Ouvrez PowerShell **en tant qu'administrateur** et exécutez :

```powershell
netsh advfirewall firewall add rule name="Remindy Backend - Port 3000" dir=in action=allow protocol=TCP localport=3000
```

## Commandes utiles

### Backend

```bash
cd backend

# Développement
npm run start:dev          # Démarre le serveur en mode watch

# Quality checks
npm run format             # Formate le code avec Prettier
npm run lint               # Vérifie le code avec ESLint
npm run test               # Lance les tests unitaires
npm run test:e2e           # Lance les tests end-to-end
npm run test:cov           # Lance les tests avec couverture

# Production
npm run build              # Compile le projet
npm run start:prod         # Démarre le serveur en production

# Database migrations
npm run migration:generate # Génère une migration
npm run migration:run      # Exécute les migrations
npm run migration:revert   # Annule la dernière migration
```

### Frontend Mobile

```bash
cd frontend_mobile

# Développement
npm start                  # Démarre Expo
npm run android            # Lance sur Android
npm run ios                # Lance sur iOS

# Environnements
npm run start:staging      # Démarre avec config staging
npm run android:staging    # Android avec staging
npm run ios:staging        # iOS avec staging

# Quality checks
npm run lint               # Vérifie le code avec ESLint
npm run test               # Lance les tests unitaires
npm run test:watch         # Lance les tests en mode watch
npm run test:coverage      # Lance les tests avec couverture
```

## Avant de faire une Pull Request

Exécutez ces commandes dans l'ordre pour chaque projet modifié :

### Backend

```bash
cd backend

# 1. Formatage du code
npm run format

# 2. Vérification du linting
npm run lint

# 3. Tests unitaires
npm run test

# 4. Tests end-to-end
npm run test:e2e

# 5. Couverture de tests
npm run test:cov

# 6. Vérifier que le serveur démarre
npm run start:dev
# Vérifiez qu'il n'y a pas d'erreurs, puis arrêtez (Ctrl+C)

# 7. Vérifier que le build fonctionne
npm run build
```

### Frontend Mobile

```bash
cd frontend_mobile

# 1. Vérification du linting
npm run lint

# 2. Tests unitaires
npm run test

# 3. Couverture de tests
npm run test:coverage

# 4. Vérifier que l'app démarre
npm start
# Vérifiez qu'il n'y a pas d'erreurs, puis arrêtez (Ctrl+C)
```

**Important :** Tous ces tests doivent passer sans erreur avant de créer votre PR.

## Déploiement

### Backend (API NestJS)

Guides complets pour déployer votre API backend en production :

- **[Quickstart - Déploiement en 10 min](BACKEND_DEPLOYMENT_QUICKSTART.md)** - Déployer sur Railway rapidement
- **[Guide complet](BACKEND_DEPLOYMENT_GUIDE.md)** - 5 options de déploiement (Railway, Render, Fly.io, DigitalOcean, AWS)
- **[Résumé](BACKEND_DEPLOYMENT_SUMMARY.md)** - Vue d'ensemble rapide avec tableaux comparatifs
- **[Guide Backend](backend/DEPLOYMENT.md)** - Documentation dans le dossier backend

**Vérification avant déploiement :**
```bash
cd backend
npm run check:deployment  # Vérifier la configuration
npm run generate:secrets  # Générer des secrets JWT
```

### Frontend Mobile (APK Android)

Guides pour déployer votre application mobile :

- **[Quickstart - Build APK en 5 min](MOBILE_DEPLOYMENT_QUICKSTART.md)** - Build rapide avec EAS
- **[Guide complet](MOBILE_DEPLOYMENT_GUIDE.md)** - Configuration complète et distribution
- **[Résumé](MOBILE_DEPLOYMENT_SUMMARY.md)** - Vue d'ensemble et checklist

**Build rapide :**
```bash
cd frontend_mobile
eas build --platform android --profile production
```

### Frontend Admin (Interface d'administration)

- **[Quickstart - Déploiement Netlify](ADMIN_DEPLOYMENT_QUICKSTART.md)** - Déployer sur Netlify en 5 min
- **[Guide complet](ADMIN_DEPLOYMENT_GUIDE.md)** - Netlify, Vercel, et autres options
- **[Résumé](ADMIN_DEPLOYMENT_SUMMARY.md)** - Vue d'ensemble rapide

## Documentation

- [Backend API Documentation](http://localhost:3000/swagger/v1) (après avoir démarré le backend)
- [Frontend Mobile - Gestion des environnements](frontend_mobile/README.md#environment-configuration)

## Développement

### Workflow recommandé

1. Créez une nouvelle branche depuis `develop`
2. Faites vos modifications
3. Exécutez tous les tests (voir section "Avant de faire une Pull Request")
4. Commitez vos changements
5. Créez une Pull Request vers `develop`

### Structure Backend (Clean Architecture)

Le backend suit les principes de Clean Architecture :
- `domain/` - Entités et logique métier
- `application/` - Cas d'utilisation et services
- `infrastructure/` - Implémentation technique (DB, APIs externes)
- `presentation/` - Contrôleurs et DTOs

### Structure Frontend Mobile (Expo Router)

L'application mobile utilise Expo avec file-based routing :
- `app/` - Pages et routes de l'application
- `components/` - Composants réutilisables
- `services/` - Services API et logique métier
- `context/` - Contextes React (authentification, etc.)
