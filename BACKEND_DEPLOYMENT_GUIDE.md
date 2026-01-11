# Guide de Déploiement Backend - Remindy API

## Table des matières
- [Vue d'ensemble](#vue-densemble)
- [Prérequis](#prérequis)
- [Services externes requis](#services-externes-requis)
- [Options de déploiement](#options-de-déploiement)
  - [Railway (Recommandé)](#1-railway-recommandé)
  - [Render](#2-render)
  - [Fly.io](#3-flyio)
  - [DigitalOcean App Platform](#4-digitalocean-app-platform)
  - [AWS Elastic Beanstalk](#5-aws-elastic-beanstalk)
- [Configuration post-déploiement](#configuration-post-déploiement)
- [Connexion avec l'APK mobile](#connexion-avec-lapk-mobile)
- [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

Votre backend Remindy est une API NestJS avec les dépendances suivantes :
- **Base de données** : PostgreSQL (Neon Database)
- **Cache** : Redis
- **Stockage** : Cloudflare R2 (S3-compatible)
- **AI/OCR** : Google Gemini
- **Email** : SendGrid
- **Auth** : JWT

---

## Prérequis

### 1. Compte Neon Database (PostgreSQL)
- Créez un compte sur [Neon.tech](https://neon.tech)
- Créez un projet et récupérez l'URL de connexion
- Format : `postgresql://user:password@host/database?sslmode=require`

### 2. Redis (plusieurs options)
**Option A - Upstash (Gratuit, Recommandé)**
- Créez un compte sur [Upstash](https://upstash.com)
- Créez une base Redis
- Récupérez : `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**Option B - Railway/Render Redis**
- Disponible directement sur la plateforme de déploiement

### 3. Cloudflare R2 (Stockage de fichiers)
- Créez un compte [Cloudflare](https://cloudflare.com)
- Allez dans R2 Object Storage
- Créez un bucket
- Générez des clés API (Access Key ID + Secret)
- Récupérez : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

### 4. Google Gemini API
- Créez un compte sur [Google AI Studio](https://ai.google.dev/)
- Générez une clé API
- Récupérez : `GEMINI_API_KEY`

### 5. SendGrid (Email)
- Créez un compte sur [SendGrid](https://sendgrid.com)
- Générez une clé API
- Vérifiez votre adresse email d'envoi
- Récupérez : `SENDGRID_API_KEY`, `MAIL_FROM`

---

## Services externes requis

### Variables d'environnement complètes

```env
# Database (Neon)
NEON_DATABASE_URL_PRODUCTION=postgresql://user:password@host/database?sslmode=require
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Environment
NODE_ENV=production
BACKEND_PORT=3000

# JWT Secrets (Générez des secrets aléatoires forts)
JWT_ACCESS_TOKEN_SECRET=votre_secret_access_super_securise_32_chars_min
JWT_REFRESH_TOKEN_SECRET=votre_secret_refresh_super_securise_32_chars_min
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d
JWT_PASSWORD_RESET_SECRET=votre_secret_reset_super_securise_32_chars_min

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM=votre-email@domain.com

# Frontend URL (pour les emails de reset password)
FRONTEND_URL=https://votre-app-mobile-url.com

# Gemini AI (OCR)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Cloudflare R2 (Stockage)
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key_id
R2_SECRET_ACCESS_KEY=votre_secret_access_key
R2_BUCKET_NAME=remindy-documents

# Redis (Upstash ou autre)
REDIS_HOST=us1-xxx-xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=votre_redis_password
REDIS_DB=0
REDIS_TLS=true
CACHE_TTL=3600000
CACHE_NAMESPACE=remindy
```

**Important** : Pour générer des secrets JWT sécurisés :
```bash
# Dans votre terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Options de déploiement

### 1. Railway (Recommandé)

**Pourquoi Railway ?**
- Configuration simple
- Redis inclus gratuitement
- Support Docker natif
- Déploiement automatique depuis GitHub
- $5/mois de crédit gratuit

**Étapes :**

#### A. Créer un compte Railway
1. Allez sur [Railway.app](https://railway.app)
2. Connectez-vous avec GitHub

#### B. Créer un nouveau projet
```bash
# Dans le dossier backend/
railway login
railway init
railway link
```

#### C. Ajouter Redis
1. Dans le dashboard Railway, cliquez sur "+ New"
2. Sélectionnez "Database" → "Redis"
3. Railway génère automatiquement les variables d'environnement

#### D. Configurer les variables d'environnement
1. Cliquez sur votre service backend
2. Allez dans "Variables"
3. Ajoutez toutes les variables listées ci-dessus
4. Railway fournit automatiquement `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

#### E. Configurer le Dockerfile
Railway détectera automatiquement votre `Dockerfile` existant.

Vérifiez que le port est correct dans `backend/src/main.ts` :
```typescript
// Utilisez le port fourni par Railway ou 3000 par défaut
const port = process.env.PORT || 3000;
await app.listen(port);
```

#### F. Déployer
```bash
railway up
```

Ou configurez le déploiement automatique depuis GitHub :
1. Settings → "Connect to GitHub"
2. Sélectionnez votre repo et la branche
3. Path : `/backend`

#### G. Exécuter les migrations
```bash
railway run npm run migration:run
```

#### H. Récupérer l'URL de production
1. Settings → "Generate Domain"
2. Votre API sera disponible à : `https://votre-app.up.railway.app`

---

### 2. Render

**Pourquoi Render ?**
- Tier gratuit généreux
- Redis inclus (plan payant)
- Simple à configurer
- Auto-déploiement depuis GitHub

**Étapes :**

#### A. Créer un compte
1. Allez sur [Render.com](https://render.com)
2. Connectez-vous avec GitHub

#### B. Créer un Web Service
1. New → "Web Service"
2. Connectez votre repository GitHub
3. Configuration :
   - **Name** : `remindy-api`
   - **Root Directory** : `backend`
   - **Environment** : `Docker`
   - **Region** : Choisissez le plus proche de vos utilisateurs
   - **Instance Type** : Free (pour commencer)

#### C. Ajouter Redis
1. New → "Redis"
2. Plan gratuit disponible (25MB)
3. Récupérez l'URL interne de connexion

Pour Redis, extrayez les variables :
```
redis://user:password@host:port
```

#### D. Variables d'environnement
1. Dans votre Web Service, allez dans "Environment"
2. Ajoutez toutes les variables
3. Pour Redis, utilisez les valeurs du service Redis créé

#### E. Build Command (si pas de Docker)
```bash
npm install && npm run build
```

#### F. Start Command (si pas de Docker)
```bash
npm run migration:run && npm run start:prod
```

#### G. Health Check
Render vérifie automatiquement `/` ou ajoutez un endpoint `/health` dans votre API

---

### 3. Fly.io

**Pourquoi Fly.io ?**
- Infrastructure moderne
- Déploiement global
- Redis Upstash intégré
- Tier gratuit disponible

**Étapes :**

#### A. Installation
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

#### B. Connexion
```bash
fly auth login
```

#### C. Initialiser l'app
```bash
cd backend
fly launch --no-deploy
```

Configurez :
- App name : `remindy-api`
- Region : Choisissez
- PostgreSQL : Non (vous utilisez Neon)
- Redis : Oui (Upstash)

#### D. Configuration fly.toml
```toml
app = "remindy-api"
primary_region = "cdg"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[[services]]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"
```

#### E. Ajouter les secrets
```bash
fly secrets set NEON_DATABASE_URL_PRODUCTION="postgresql://..."
fly secrets set JWT_ACCESS_TOKEN_SECRET="..."
fly secrets set JWT_REFRESH_TOKEN_SECRET="..."
fly secrets set JWT_PASSWORD_RESET_SECRET="..."
fly secrets set SENDGRID_API_KEY="SG...."
fly secrets set MAIL_FROM="email@domain.com"
fly secrets set GEMINI_API_KEY="AIza..."
fly secrets set R2_ACCOUNT_ID="..."
fly secrets set R2_ACCESS_KEY_ID="..."
fly secrets set R2_SECRET_ACCESS_KEY="..."
fly secrets set R2_BUCKET_NAME="remindy-documents"
fly secrets set REDIS_HOST="..."
fly secrets set REDIS_PORT="6379"
fly secrets set REDIS_PASSWORD="..."
fly secrets set REDIS_TLS="true"
fly secrets set FRONTEND_URL="https://votre-app.com"
```

#### F. Déployer
```bash
fly deploy
```

#### G. Exécuter les migrations
```bash
fly ssh console
cd /app
npm run migration:run
exit
```

#### H. URL de production
Votre API sera disponible à : `https://remindy-api.fly.dev`

---

### 4. DigitalOcean App Platform

**Pourquoi DigitalOcean ?**
- Infrastructure fiable
- Managed Redis disponible
- $200 de crédit gratuit (nouveau compte)
- Interface simple

**Étapes :**

#### A. Créer un compte
1. [DigitalOcean](https://www.digitalocean.com)
2. Récupérez les $200 de crédit gratuit

#### B. Créer une App
1. Apps → "Create App"
2. Source : GitHub → Sélectionnez votre repo
3. Branch : `main` ou `develop`
4. Source Directory : `/backend`

#### C. Configuration
- **Type** : Web Service
- **Dockerfile Path** : `Dockerfile`
- **HTTP Port** : 3000
- **Instance Size** : Basic ($5/mois)

#### D. Créer un Redis Managed Database
1. Databases → "Create Database Cluster"
2. Type : Redis
3. Plan : $15/mois (pas de tier gratuit Redis)
4. Récupérez les credentials

**Alternative** : Utilisez Upstash (gratuit)

#### E. Variables d'environnement
1. Settings → "App-Level Environment Variables"
2. Ajoutez toutes les variables

#### F. Déployer
DigitalOcean déploie automatiquement depuis GitHub

#### G. Exécuter les migrations
1. Console → "Run Command"
```bash
npm run migration:run
```

---

### 5. AWS Elastic Beanstalk

**Pourquoi AWS ?**
- Scalabilité maximale
- Services complets (RDS, ElastiCache)
- Tier gratuit 12 mois

**Étapes :**

#### A. Installation AWS CLI & EB CLI
```bash
# AWS CLI
# https://aws.amazon.com/cli/

# EB CLI
pip install awsebcli --upgrade
```

#### B. Configuration
```bash
cd backend
eb init

# Configuration
# Application name: remindy-api
# Platform: Docker
# Region: eu-west-1
# SSH: Oui
```

#### C. Créer l'environnement
```bash
eb create remindy-production

# Instance type: t3.micro (tier gratuit)
# Load balancer: Oui
```

#### D. Configuration Redis
Option 1 : ElastiCache (AWS)
- Services → ElastiCache → Create cluster
- Redis, t3.micro

Option 2 : Upstash (plus simple)

#### E. Variables d'environnement
```bash
eb setenv NEON_DATABASE_URL_PRODUCTION="postgresql://..."
eb setenv JWT_ACCESS_TOKEN_SECRET="..."
# ... toutes les autres variables
```

Ou via la console AWS :
1. Elastic Beanstalk → Environment → Configuration
2. Software → Environment properties

#### F. Déployer
```bash
eb deploy
```

#### G. Exécuter les migrations
```bash
eb ssh
cd /var/app/current
npm run migration:run
exit
```

#### H. URL de production
```bash
eb status
# URL: http://remindy-production.eu-west-1.elasticbeanstalk.com
```

---

## Configuration post-déploiement

### 1. Tester votre API

#### Health Check
```bash
curl https://votre-api-url.com/api
```

Vous devriez voir la documentation Swagger.

#### Test d'authentification
```bash
curl -X POST https://votre-api-url.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Exécuter les seeds (optionnel)
```bash
# Selon votre plateforme :
railway run npm run seed
# ou
fly ssh console -C "npm run seed"
# ou via EB, Render console...
```

### 3. Configurer CORS pour production

Modifiez `backend/src/main.ts` :

```typescript
// Remplacez cette section :
app.enableCors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'boundary',
  ],
  exposedHeaders: ['Content-Disposition'],
});

// Par :
const isProduction = process.env.NODE_ENV === 'production';
app.enableCors({
  origin: isProduction
    ? [
        'https://votre-domaine-mobile.com', // Si vous avez un domaine
        'exp://*', // Pour Expo Go
        'http://localhost:8081', // Dev local mobile
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'boundary',
  ],
  exposedHeaders: ['Content-Disposition'],
});
```

### 4. Monitoring et Logs

#### Railway
```bash
railway logs
```

#### Render
Dashboard → Logs (temps réel)

#### Fly.io
```bash
fly logs
```

#### DigitalOcean
App → Runtime Logs

#### AWS
CloudWatch → Log Groups → `/aws/elasticbeanstalk/remindy-production`

---

## Connexion avec l'APK mobile

### 1. Mettre à jour la configuration mobile

Dans votre projet `frontend_mobile`, créez/modifiez `.env.production` :

```env
EXPO_PUBLIC_API_URL=https://votre-api-url.com
```

Exemples selon la plateforme :
```env
# Railway
EXPO_PUBLIC_API_URL=https://remindy-api.up.railway.app

# Render
EXPO_PUBLIC_API_URL=https://remindy-api.onrender.com

# Fly.io
EXPO_PUBLIC_API_URL=https://remindy-api.fly.dev

# DigitalOcean
EXPO_PUBLIC_API_URL=https://remindy-api-xxxxx.ondigitalocean.app

# AWS
EXPO_PUBLIC_API_URL=https://remindy-production.eu-west-1.elasticbeanstalk.com
```

### 2. Configurer les différents environnements

Créez plusieurs fichiers `.env` :

**`.env.development`** (local)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**`.env.staging`** (test)
```env
EXPO_PUBLIC_API_URL=https://remindy-staging.up.railway.app
```

**`.env.production`** (production)
```env
EXPO_PUBLIC_API_URL=https://remindy-api.up.railway.app
```

### 3. Modifier le code mobile pour utiliser l'API URL

Dans votre code React Native/Expo, utilisez :

```typescript
// services/api.ts ou similar
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 4. Build avec EAS

Pour build avec l'environnement production :

```bash
# Dans frontend_mobile/
eas build --platform android --profile production
```

Assurez-vous que votre `eas.json` utilise le bon fichier `.env` :

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://votre-api-url.com"
      }
    }
  }
}
```

### 5. Tester la connexion

Dans votre app mobile, ajoutez un écran de debug :

```typescript
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export default function DebugScreen() {
  const [apiStatus, setApiStatus] = useState('Checking...');

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/api`)
      .then(res => res.text())
      .then(() => setApiStatus('✅ API Connected!'))
      .catch(() => setApiStatus('❌ API Error'));
  }, []);

  return (
    <View>
      <Text>API URL: {process.env.EXPO_PUBLIC_API_URL}</Text>
      <Text>Status: {apiStatus}</Text>
    </View>
  );
}
```

---

## Troubleshooting

### Problème : CORS errors

**Solution** :
1. Vérifiez que `CORS` est configuré pour accepter les requêtes de votre app mobile
2. Ajoutez `exp://*` dans les origins autorisées
3. Redéployez l'API

### Problème : 502 Bad Gateway

**Causes possibles** :
- L'app ne démarre pas correctement
- Port incorrect (doit être 3000 ou `process.env.PORT`)
- Migrations non exécutées

**Solution** :
```bash
# Vérifiez les logs
railway logs
# ou
fly logs

# Vérifiez que les migrations sont exécutées
railway run npm run migration:run
```

### Problème : Database connection failed

**Solution** :
1. Vérifiez que `DATABASE_URL` ou `NEON_DATABASE_URL_PRODUCTION` est défini
2. Vérifiez que l'URL contient `?sslmode=require`
3. Testez la connexion :
```bash
railway run npm run typeorm -- query "SELECT 1"
```

### Problème : Redis connection failed

**Solution** :
1. Si vous utilisez Upstash, vérifiez que `REDIS_TLS=true`
2. Vérifiez les credentials : `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
3. Testez Redis :
```bash
railway run node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_HOST); r.ping().then(console.log)"
```

### Problème : File upload errors (Cloudflare R2)

**Solution** :
1. Vérifiez les credentials R2 : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
2. Vérifiez que le bucket existe : `R2_BUCKET_NAME`
3. Vérifiez les permissions du bucket (lecture/écriture)

### Problème : JWT tokens invalides

**Solution** :
1. Vérifiez que les secrets JWT sont bien définis et identiques entre déploiements
2. Utilisez des secrets d'au moins 32 caractères
3. Ne changez jamais les secrets en production (invalide tous les tokens)

### Problème : L'app mobile ne peut pas se connecter

**Solution** :
1. Vérifiez que `EXPO_PUBLIC_API_URL` est correct dans l'app mobile
2. Testez l'URL dans un navigateur : `https://votre-api-url.com/api`
3. Vérifiez les logs réseau dans React Native Debugger
4. Vérifiez que l'APK a été build avec la bonne URL

---

## Checklist finale

Avant de mettre en production :

- [ ] Base de données Neon configurée et accessible
- [ ] Redis configuré (Upstash ou autre)
- [ ] Cloudflare R2 bucket créé et credentials générés
- [ ] SendGrid configuré avec domaine vérifié
- [ ] Gemini API key générée
- [ ] Toutes les variables d'environnement définies
- [ ] Secrets JWT générés (32+ caractères)
- [ ] Migrations exécutées
- [ ] Seeds exécutés (optionnel)
- [ ] CORS configuré pour mobile
- [ ] API testée (endpoints fonctionnels)
- [ ] URL de production configurée dans l'app mobile
- [ ] Build mobile créé avec EAS
- [ ] Logs de production surveillés
- [ ] Health checks configurés

---

## Recommandations finales

### Pour un démarrage rapide
**Utilisez Railway** :
- Configuration la plus simple
- Redis inclus
- Déploiement en 5 minutes
- Tier gratuit généreux

### Pour la production
**Fly.io ou Render** :
- Infrastructure moderne
- Meilleure performance
- Monitoring inclus
- Scaling automatique

### Services externes recommandés
- **Database** : Neon (PostgreSQL serverless)
- **Redis** : Upstash (tier gratuit)
- **Stockage** : Cloudflare R2 (pas de frais de sortie)
- **Email** : SendGrid (tier gratuit : 100 emails/jour)
- **AI** : Google Gemini (tier gratuit généreux)

### Sécurité
- Utilisez HTTPS partout
- Changez tous les secrets de l'exemple
- Activez 2FA sur tous vos services
- Sauvegardez votre base de données régulièrement
- Surveillez les logs d'erreur
- Limitez le rate-limiting dans NestJS (déjà configuré avec Throttler)

---

**Besoin d'aide ?** Consultez les documentations :
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
