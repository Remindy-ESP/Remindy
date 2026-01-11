# Quickstart - Déploiement Backend en 10 minutes

Guide rapide pour déployer votre API Remindy avec Railway (la solution la plus simple).

---

## Étape 1 : Préparer les services externes (5 min)

### 1.1 Base de données PostgreSQL (Neon)
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Copiez l'URL de connexion qui ressemble à :
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 1.2 Redis (Upstash)
1. Allez sur [upstash.com](https://upstash.com)
2. Créez un compte gratuit
3. Créez une base Redis
4. Notez :
   - **Endpoint** (host:port) → ex: `us1-xxx.upstash.io:6379`
   - **Password**

### 1.3 Cloudflare R2 (Stockage)
1. Allez sur [cloudflare.com](https://cloudflare.com)
2. Dashboard → R2 Object Storage
3. Créez un bucket (ex: `remindy-documents`)
4. Créez des clés API (Manage R2 API Tokens)
5. Notez :
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**
   - **Bucket Name**

### 1.4 Google Gemini (AI/OCR)
1. Allez sur [ai.google.dev](https://ai.google.dev/)
2. Get API Key
3. Notez la clé (commence par `AIza...`)

### 1.5 SendGrid (Email)
1. Allez sur [sendgrid.com](https://sendgrid.com)
2. Créez un compte gratuit (100 emails/jour)
3. Settings → API Keys → Create API Key
4. Vérifiez votre adresse email d'envoi (Sender Authentication)
5. Notez :
   - **API Key** (commence par `SG.`)
   - **Email vérifié**

### 1.6 Générer les secrets JWT
```bash
# Exécutez cette commande 3 fois pour générer 3 secrets différents
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Étape 2 : Déployer sur Railway (5 min)

### 2.1 Créer un compte Railway
1. Allez sur [railway.app](https://railway.app)
2. Connectez-vous avec GitHub

### 2.2 Créer un nouveau projet
1. Cliquez sur "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Autorisez Railway à accéder à vos repos
4. Sélectionnez votre repo `remindy_personal`
5. Ajoutez le service :
   - **Root Directory** : `/backend`
   - **Watch Paths** : `/backend/**`

### 2.3 Ajouter Redis
1. Dans le projet Railway, cliquez sur "+ New"
2. Sélectionnez "Database" → "Add Redis"
3. Railway génère automatiquement : `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**OU** utilisez Upstash (étape 1.2) pour rester dans le tier gratuit.

### 2.4 Configurer les variables d'environnement

Cliquez sur votre service backend → "Variables" → "Add Variables"

Copiez-collez ce bloc et remplacez les valeurs :

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NEON_DATABASE_URL_PRODUCTION=postgresql://user:password@host/database?sslmode=require

# Environment
NODE_ENV=production
PORT=3000

# JWT Secrets (utilisez vos secrets générés à l'étape 1.6)
JWT_ACCESS_TOKEN_SECRET=votre_premier_secret_64_caracteres
JWT_REFRESH_TOKEN_SECRET=votre_deuxieme_secret_64_caracteres
JWT_PASSWORD_RESET_SECRET=votre_troisieme_secret_64_caracteres
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d

# SendGrid (étape 1.5)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM=votre-email-verifie@domain.com

# Frontend URL (pour les emails de reset password)
FRONTEND_URL=https://your-app.com

# Gemini AI (étape 1.4)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Cloudflare R2 (étape 1.3)
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key_id
R2_SECRET_ACCESS_KEY=votre_secret_access_key
R2_BUCKET_NAME=remindy-documents

# Redis - Option A : Railway Redis (automatique)
# Railway génère automatiquement REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

# Redis - Option B : Upstash (étape 1.2)
REDIS_HOST=us1-xxx-xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=votre_upstash_password
REDIS_TLS=true
REDIS_DB=0
CACHE_TTL=3600000
CACHE_NAMESPACE=remindy
```

### 2.5 Mettre à jour le port dans le code

Railway utilise la variable `PORT`, assurez-vous que `backend/src/main.ts` l'utilise :

```typescript
// Ligne 58, remplacez :
await app.listen(3000);

// Par :
const port = process.env.PORT || 3000;
await app.listen(port);
console.log(`Listening on port ${port}`);
```

Commitez et pushez ce changement.

### 2.6 Déployer
Railway déploie automatiquement dès que vous pushez sur GitHub.

Suivez le déploiement dans : "Deployments" → Logs en temps réel

### 2.7 Générer un domaine public
1. Settings → "Networking"
2. Cliquez sur "Generate Domain"
3. Votre API sera accessible à : `https://votre-app.up.railway.app`

### 2.8 Exécuter les migrations
1. Cliquez sur votre service backend
2. Settings → "Deploy" → "Run Command"
3. Exécutez :
```bash
npm run migration:run
```

OU via CLI locale :
```bash
# Installez Railway CLI
npm install -g @railway/cli

# Connectez-vous
railway login

# Liez votre projet
railway link

# Exécutez les migrations
railway run npm run migration:run
```

---

## Étape 3 : Tester l'API (1 min)

### 3.1 Vérifier que l'API fonctionne
Ouvrez dans votre navigateur :
```
https://votre-app.up.railway.app/api
```

Vous devriez voir la documentation Swagger.

### 3.2 Test rapide
```bash
curl https://votre-app.up.railway.app/api
```

---

## Étape 4 : Connecter l'app mobile (2 min)

### 4.1 Mettre à jour la configuration mobile

Dans `frontend_mobile/.env.production` :
```env
EXPO_PUBLIC_API_URL=https://votre-app.up.railway.app
```

### 4.2 Mettre à jour `eas.json`

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://votre-app.up.railway.app"
      }
    }
  }
}
```

### 4.3 Rebuild l'APK
```bash
cd frontend_mobile
eas build --platform android --profile production
```

### 4.4 Tester
Une fois l'APK installé, testez :
- Inscription d'un utilisateur
- Connexion
- Upload d'un document
- Vérifiez que l'OCR fonctionne

---

## Troubleshooting rapide

### L'API ne démarre pas
1. Vérifiez les logs dans Railway : "Deployments" → Cliquez sur le déploiement
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que le port est correct (`process.env.PORT`)

### Erreur de connexion à la base de données
1. Vérifiez que `DATABASE_URL` contient `?sslmode=require`
2. Testez la connexion Neon :
```bash
railway run npm run typeorm -- query "SELECT 1"
```

### Erreur Redis
1. Si vous utilisez Upstash, vérifiez que `REDIS_TLS=true`
2. Vérifiez les credentials

### L'app mobile ne se connecte pas
1. Vérifiez que `EXPO_PUBLIC_API_URL` est correct
2. Testez l'URL dans un navigateur
3. Vérifiez les CORS dans `backend/src/main.ts`

---

## Monitoring

### Voir les logs en temps réel
```bash
railway logs --follow
```

### Voir les métriques
Railway Dashboard → Metrics (CPU, Mémoire, Réseau)

---

## Coûts

### Railway (Recommandé)
- **Tier gratuit** : $5/mois de crédit
- **Starter Plan** : $5/mois (500h)
- **Pro Plan** : $20/mois (usage illimité)

Avec le tier gratuit, vous pouvez faire tourner :
- API backend (~200-300h/mois)
- Redis (~200-300h/mois)

**Total : Gratuit les premiers mois** avec $5 de crédit.

### Services externes (tous gratuits)
- **Neon** : 0.5GB gratuit
- **Upstash Redis** : 10k commandes/jour gratuit
- **Cloudflare R2** : 10GB stockage + 1M requêtes/mois gratuit
- **SendGrid** : 100 emails/jour gratuit
- **Gemini** : Tier gratuit très généreux

**Coût total pour démarrer : 0€**

---

## Prochaines étapes

1. **Configurez les CORS** pour production dans `backend/src/main.ts`
2. **Ajoutez un domaine personnalisé** (optionnel)
3. **Configurez les sauvegardes** de la base de données Neon
4. **Activez 2FA** sur tous vos comptes (Railway, Neon, Upstash, etc.)
5. **Surveillez les logs** pour détecter les erreurs

---

## Support

- **Documentation complète** : Voir `BACKEND_DEPLOYMENT_GUIDE.md`
- **Railway Docs** : https://docs.railway.app
- **Neon Docs** : https://neon.tech/docs
- **NestJS Docs** : https://docs.nestjs.com

Vous avez maintenant une API backend déployée et prête à recevoir les requêtes de votre app mobile !
