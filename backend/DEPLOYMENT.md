# Déploiement Backend Remindy

## Guides disponibles

Ce dossier contient tout ce dont vous avez besoin pour déployer l'API backend Remindy.

### 🚀 Démarrage rapide (10 minutes)
Consultez [`../BACKEND_DEPLOYMENT_QUICKSTART.md`](../BACKEND_DEPLOYMENT_QUICKSTART.md)

Ce guide vous permet de déployer votre API sur **Railway** en 10 minutes avec :
- Configuration des services externes (Neon, Upstash, R2, Gemini, SendGrid)
- Déploiement automatique depuis GitHub
- Connexion avec l'application mobile

### 📚 Guide complet
Consultez [`../BACKEND_DEPLOYMENT_GUIDE.md`](../BACKEND_DEPLOYMENT_GUIDE.md)

Ce guide couvre **5 plateformes de déploiement** :
1. **Railway** (recommandé pour démarrer)
2. **Render** (bon compromis)
3. **Fly.io** (performance maximale)
4. **DigitalOcean App Platform** (infrastructure complète)
5. **AWS Elastic Beanstalk** (scaling maximal)

### 📋 Résumé
Consultez [`../BACKEND_DEPLOYMENT_SUMMARY.md`](../BACKEND_DEPLOYMENT_SUMMARY.md)

Vue d'ensemble rapide avec :
- Tableau comparatif des plateformes
- Checklist de déploiement
- Coûts estimés
- Troubleshooting rapide

---

## Vérification avant déploiement

Avant de déployer, vérifiez que votre configuration est complète :

```bash
# Vérifier la configuration
npm run check:deployment

# Générer des secrets JWT sécurisés
npm run generate:secrets
```

---

## Prérequis

### Services externes requis

| Service | Description | Lien |
|---------|-------------|------|
| **Neon Database** | PostgreSQL serverless | [neon.tech](https://neon.tech) |
| **Upstash Redis** | Redis serverless | [upstash.com](https://upstash.com) |
| **Cloudflare R2** | Stockage de fichiers S3-compatible | [cloudflare.com](https://cloudflare.com) |
| **Google Gemini** | AI pour OCR | [ai.google.dev](https://ai.google.dev) |
| **SendGrid** | Emails transactionnels | [sendgrid.com](https://sendgrid.com) |

Tous ces services ont un **tier gratuit** suffisant pour démarrer.

---

## Configuration locale

### Installation

```bash
npm install
```

### Variables d'environnement

Copiez `.env.exemple` en `.env` et remplissez les valeurs :

```bash
cp .env.exemple .env
```

Variables essentielles :
- `NEON_DATABASE_URL_DEV` : URL de connexion PostgreSQL
- `JWT_ACCESS_TOKEN_SECRET` : Secret pour les tokens d'accès (64+ caractères)
- `JWT_REFRESH_TOKEN_SECRET` : Secret pour les tokens de refresh (64+ caractères)
- `GEMINI_API_KEY` : Clé API Google Gemini
- `R2_*` : Credentials Cloudflare R2
- `SENDGRID_API_KEY` : Clé API SendGrid
- `REDIS_*` : Configuration Redis

### Démarrage local

```bash
# Démarrer Redis (Docker)
npm run redis:start

# Exécuter les migrations
npm run migration:run

# Démarrer en mode développement
npm run start:dev
```

L'API sera disponible sur : http://localhost:3000

Documentation Swagger : http://localhost:3000/api

---

## Déploiement

### Option 1 : Railway (Recommandé)

**Déploiement le plus simple, tier gratuit disponible**

1. Créez un compte sur [railway.app](https://railway.app)
2. Connectez votre repository GitHub
3. Configurez les variables d'environnement
4. Railway déploie automatiquement

[Guide détaillé Railway →](../BACKEND_DEPLOYMENT_QUICKSTART.md)

### Option 2 : Render

**Bon compromis simplicité/performance**

1. Créez un compte sur [render.com](https://render.com)
2. New → Web Service → Connectez GitHub
3. Configurez les variables d'environnement
4. Render déploie automatiquement

[Guide détaillé Render →](../BACKEND_DEPLOYMENT_GUIDE.md#2-render)

### Option 3 : Fly.io

**Performance maximale, déploiement global**

```bash
# Installation
curl -L https://fly.io/install.sh | sh

# Connexion
fly auth login

# Initialisation
fly launch

# Déploiement
fly deploy
```

[Guide détaillé Fly.io →](../BACKEND_DEPLOYMENT_GUIDE.md#3-flyio)

---

## Post-déploiement

### 1. Exécuter les migrations

```bash
# Railway
railway run npm run migration:run

# Fly.io
fly ssh console -C "npm run migration:run"

# Render
# Via le shell dans le dashboard
```

### 2. Tester l'API

```bash
# Vérifier que l'API est accessible
curl https://votre-api-url.com/api

# Tester l'inscription
curl -X POST https://votre-api-url.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","firstName":"John","lastName":"Doe"}'
```

### 3. Connecter l'application mobile

Dans `frontend_mobile/.env.production` :
```env
EXPO_PUBLIC_API_URL=https://votre-api-url.com
```

Puis rebuilder l'APK :
```bash
cd ../frontend_mobile
eas build --platform android --profile production
```

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run start:dev` | Démarrer en mode développement |
| `npm run start:prod` | Démarrer en mode production |
| `npm run build` | Compiler le projet |
| `npm run migration:run` | Exécuter les migrations |
| `npm run migration:generate` | Générer une nouvelle migration |
| `npm run check:deployment` | Vérifier la configuration de déploiement |
| `npm run generate:secrets` | Générer des secrets JWT sécurisés |
| `npm run redis:start` | Démarrer Redis (Docker local) |
| `npm run redis:stop` | Arrêter Redis |

---

## Monitoring

### Logs

```bash
# Railway
railway logs --follow

# Fly.io
fly logs

# Render
# Via le dashboard web
```

### Health Check

Toutes les plateformes vérifient automatiquement la santé de l'API.

L'endpoint `/api` (documentation Swagger) sert de health check.

---

## Troubleshooting

### Erreur : Cannot connect to database

**Solution** :
- Vérifiez que `DATABASE_URL` contient `?sslmode=require`
- Testez la connexion : `railway run npm run typeorm -- query "SELECT 1"`

### Erreur : Redis connection failed

**Solution** :
- Si Upstash : vérifiez `REDIS_TLS=true`
- Vérifiez les credentials

### Erreur : File upload failed

**Solution** :
- Vérifiez les credentials Cloudflare R2
- Vérifiez que le bucket existe

### Erreur : CORS

**Solution** :
- Vérifiez la configuration CORS dans `src/main.ts`
- Ajoutez l'origine de votre app mobile dans la liste autorisée

[Troubleshooting complet →](../BACKEND_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## Sécurité

### Checklist de sécurité

- [ ] Secrets JWT de 64+ caractères
- [ ] HTTPS activé (automatique sur Railway/Render/Fly)
- [ ] CORS configuré pour production
- [ ] Variables d'environnement sécurisées (jamais committées)
- [ ] 2FA activé sur tous les services
- [ ] Sauvegardes automatiques de la base de données

### Recommandations

1. **Ne jamais committer les secrets** : `.env` est dans `.gitignore`
2. **Utiliser HTTPS partout** : Automatique sur les plateformes modernes
3. **Limiter les origins CORS** : Configuré dans `src/main.ts`
4. **Sauvegarder régulièrement** : Neon fait des backups automatiques
5. **Surveiller les logs** : Détectez les erreurs rapidement

---

## Support

Besoin d'aide ? Consultez :
- [NestJS Documentation](https://docs.nestjs.com)
- [Railway Documentation](https://docs.railway.app)
- [Neon Documentation](https://neon.tech/docs)
- [TypeORM Documentation](https://typeorm.io)

---

## Architecture

```
backend/
├── src/
│   ├── modules/          # Modules métier (auth, user, document, etc.)
│   ├── infrastructure/   # Infrastructure (database, config, cache)
│   └── main.ts          # Point d'entrée
├── scripts/
│   └── check-deployment-readiness.js  # Vérification config
├── Dockerfile           # Docker pour déploiement
└── package.json        # Dépendances et scripts
```

---

**Prêt à déployer ?**

👉 Suivez le [guide quickstart](../BACKEND_DEPLOYMENT_QUICKSTART.md) pour déployer en 10 minutes !
