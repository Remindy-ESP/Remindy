# Résumé - Déploiement Backend Remindy

## Vue d'ensemble rapide

Votre API backend Remindy est une application **NestJS** qui nécessite :

### Services requis
| Service | Utilité | Recommandation | Coût |
|---------|---------|----------------|------|
| **PostgreSQL** | Base de données | Neon Database | Gratuit (0.5GB) |
| **Redis** | Cache/Sessions | Upstash | Gratuit (10k ops/jour) |
| **Cloudflare R2** | Stockage de fichiers | Cloudflare R2 | Gratuit (10GB + 1M req/mois) |
| **Gemini AI** | OCR/Analyse documents | Google Gemini | Gratuit (tier généreux) |
| **SendGrid** | Emails transactionnels | SendGrid | Gratuit (100 emails/jour) |

### Plateformes de déploiement
| Plateforme | Difficulté | Prix | Tier Gratuit | Recommandation |
|------------|------------|------|--------------|----------------|
| **Railway** | ⭐ Facile | $5/mois | $5 crédit/mois | **Recommandé pour démarrer** |
| **Render** | ⭐⭐ Facile | $7/mois | 750h/mois gratuit | Bon pour production |
| **Fly.io** | ⭐⭐ Moyen | Variable | Oui | Performance maximale |
| **DigitalOcean** | ⭐⭐⭐ Moyen | $5/mois | $200 crédit nouveau compte | Pour infrastructure complète |
| **AWS EB** | ⭐⭐⭐⭐ Difficile | Variable | 12 mois gratuit | Pour scaling maximal |

---

## Démarrage rapide (10 minutes)

### 1. Services externes (5 min)

Créez des comptes et récupérez les clés :

```bash
# PostgreSQL (Neon)
✓ URL de connexion : postgresql://user:pass@host/db?sslmode=require

# Redis (Upstash)
✓ Host : us1-xxx.upstash.io
✓ Port : 6379
✓ Password : xxxxx

# Cloudflare R2
✓ Account ID : xxxxx
✓ Access Key ID : xxxxx
✓ Secret Key : xxxxx
✓ Bucket Name : remindy-documents

# Gemini AI
✓ API Key : AIzaxxxxx

# SendGrid
✓ API Key : SG.xxxxx
✓ Email vérifié : votre@email.com

# JWT Secrets (générez 3 secrets de 64 caractères)
✓ node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Déployer sur Railway (5 min)

```bash
# 1. Créez un compte sur railway.app
# 2. Connectez GitHub
# 3. New Project → Deploy from GitHub
# 4. Sélectionnez votre repo
# 5. Root Directory : /backend
# 6. Ajoutez Redis : + New → Database → Redis
# 7. Configurez les variables d'environnement (voir ci-dessous)
# 8. Generate Domain
# 9. Exécutez : railway run npm run migration:run
```

### Variables d'environnement (Railway)

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NODE_ENV=production
JWT_ACCESS_TOKEN_SECRET=votre_secret_64_chars
JWT_REFRESH_TOKEN_SECRET=votre_secret_64_chars
JWT_PASSWORD_RESET_SECRET=votre_secret_64_chars
SENDGRID_API_KEY=SG.xxxxx
MAIL_FROM=votre@email.com
GEMINI_API_KEY=AIzaxxxxx
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=remindy-documents
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxxxx
REDIS_TLS=true
```

### 3. Tester l'API

```bash
# Ouvrez dans votre navigateur
https://votre-app.up.railway.app/api

# Ou testez avec curl
curl https://votre-app.up.railway.app/api
```

---

## Connexion avec l'APK mobile

### 1. Configuration mobile

Dans `frontend_mobile/.env.production` :
```env
EXPO_PUBLIC_API_URL=https://votre-app.up.railway.app
```

### 2. Build EAS

Dans `eas.json` :
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://votre-app.up.railway.app"
      }
    }
  }
}
```

Build :
```bash
cd frontend_mobile
eas build --platform android --profile production
```

---

## Checklist de déploiement

Avant de déployer :

- [ ] Tous les services externes configurés (Neon, Upstash, R2, Gemini, SendGrid)
- [ ] Secrets JWT générés (64+ caractères chacun)
- [ ] Variables d'environnement définies sur la plateforme
- [ ] Code committé et pushé sur GitHub
- [ ] Port modifié dans `main.ts` pour utiliser `process.env.PORT`
- [ ] CORS configuré pour production

Après déploiement :

- [ ] Migrations exécutées : `npm run migration:run`
- [ ] API accessible : `https://votre-url.com/api`
- [ ] Test d'inscription/connexion fonctionne
- [ ] Upload de document fonctionne
- [ ] OCR fonctionne
- [ ] App mobile connectée et fonctionnelle

---

## Outils utiles

### Script de vérification

Vérifiez votre configuration avant déploiement :
```bash
cd backend
node scripts/check-deployment-readiness.js
```

Générez des secrets JWT :
```bash
node scripts/check-deployment-readiness.js --generate-secrets
```

### Logs en temps réel

```bash
# Railway
railway logs --follow

# Render
# Via dashboard

# Fly.io
fly logs

# DigitalOcean
# Via console web
```

### Exécuter les migrations

```bash
# Railway
railway run npm run migration:run

# Fly.io
fly ssh console -C "npm run migration:run"

# Render
# Via shell dans le dashboard
```

---

## Coûts estimés

### Configuration minimale (gratuite)
- **Hosting** : Railway ($5 crédit/mois → ~3 mois gratuit)
- **Database** : Neon gratuit (0.5GB)
- **Redis** : Upstash gratuit (10k ops/jour)
- **Storage** : R2 gratuit (10GB + 1M req/mois)
- **Email** : SendGrid gratuit (100/jour)
- **AI** : Gemini gratuit

**Total : 0€** pour démarrer

### Configuration production
- **Hosting** : Railway Starter $5/mois ou Render $7/mois
- **Database** : Neon Pro $19/mois (si >0.5GB)
- **Redis** : Upstash Pro $10/mois (si >10k ops/jour)
- **Storage** : R2 ~$1/mois pour 50GB
- **Email** : SendGrid Essentials $20/mois (50k emails)
- **AI** : Gemini Pay-as-you-go

**Total : ~$12-57/mois** selon usage

---

## Troubleshooting rapide

### ❌ API ne démarre pas
- Vérifiez les logs : `railway logs`
- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez que le port est `process.env.PORT`

### ❌ Erreur de connexion à la base de données
- Ajoutez `?sslmode=require` à l'URL
- Vérifiez que l'URL commence par `postgresql://`
- Testez : `railway run npm run typeorm -- query "SELECT 1"`

### ❌ Erreur Redis
- Si Upstash : vérifiez `REDIS_TLS=true`
- Vérifiez host/port/password

### ❌ Upload de fichiers échoue
- Vérifiez les credentials R2
- Vérifiez que le bucket existe
- Testez l'upload manuellement via R2 dashboard

### ❌ App mobile ne se connecte pas
- Vérifiez `EXPO_PUBLIC_API_URL` dans l'app
- Testez l'URL dans un navigateur
- Vérifiez les CORS dans `main.ts`
- Rebuilder l'APK avec EAS

---

## Documentation complète

- **Guide complet** : `BACKEND_DEPLOYMENT_GUIDE.md` (toutes les plateformes)
- **Quickstart** : `BACKEND_DEPLOYMENT_QUICKSTART.md` (Railway en 10 min)
- **Mobile** : `MOBILE_DEPLOYMENT_GUIDE.md` (déploiement APK)

---

## Support

Pour plus d'aide, consultez :
- [Railway Documentation](https://docs.railway.app)
- [NestJS Documentation](https://docs.nestjs.com)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Documentation](https://docs.upstash.com)

---

**Prêt à déployer ?** Suivez le guide quickstart : `BACKEND_DEPLOYMENT_QUICKSTART.md`
