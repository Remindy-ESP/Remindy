# Déploiement GRATUIT sur Render

Guide rapide pour déployer votre backend NestJS sur Render **gratuitement** (tier gratuit permanent).

---

## Pourquoi Render gratuit ?

- ✅ **Vraiment gratuit** (750 heures/mois = 24/7 pour 1 app)
- ✅ **Pas de carte bancaire requise**
- ✅ PostgreSQL gratuit inclus (90 jours rétention)
- ✅ Redis gratuit inclus (25MB)
- ✅ HTTPS automatique
- ✅ Déploiement auto depuis GitHub
- ⚠️ Sleep après 15 min d'inactivité (redémarre en ~30 sec)

---

## Déploiement en 10 minutes

### Étape 1 : Préparer les services externes (5 min)

Même procédure que pour Railway, vous avez besoin de :

**1. Neon Database (PostgreSQL)**
- [neon.tech](https://neon.tech) → Créer un projet
- Récupérez l'URL : `postgresql://user:pass@host/db?sslmode=require`

**2. Upstash Redis**
- [upstash.com](https://upstash.com) → Créer une base Redis
- Récupérez : Host, Port, Password

**3. Cloudflare R2**
- Account ID, Access Key ID, Secret Key, Bucket Name

**4. Google Gemini**
- API Key

**5. SendGrid**
- API Key, Email vérifié

**6. Secrets JWT**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Exécutez 3 fois pour générer 3 secrets différents.

---

### Étape 2 : Créer un compte Render (1 min)

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started for Free"**
3. Connectez-vous avec **GitHub**

**Pas besoin de carte bancaire !**

---

### Étape 3 : Créer un Web Service (2 min)

1. Dashboard Render → **"New +"** → **"Web Service"**

2. **Connect a repository** :
   - Cliquez sur **"Configure account"** si c'est la première fois
   - Autorisez Render à accéder à vos repos GitHub
   - Sélectionnez votre repo **`remindy_personal`**

3. **Configuration du service** :
   ```
   Name: remindy-api
   Region: Frankfurt (EU Central) ou Oregon (US West)
   Branch: main (ou develop)
   Root Directory: backend
   ```

4. **Runtime** :
   - **Environment** : Docker
   - Render détecte automatiquement votre `Dockerfile`

5. **Instance Type** :
   - Sélectionnez **"Free"** (0$/mois)

6. **Cliquez sur "Create Web Service"**

Render va commencer à builder votre app (prend ~5 min).

---

### Étape 4 : Configurer les variables d'environnement (2 min)

1. Dans votre service, allez dans **"Environment"** (menu de gauche)

2. Cliquez sur **"Add Environment Variable"**

3. Ajoutez toutes ces variables :

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEON_DATABASE_URL_PRODUCTION=postgresql://user:pass@host/db?sslmode=require

# Environment
NODE_ENV=production

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=votre_secret_64_caracteres_1
JWT_REFRESH_TOKEN_SECRET=votre_secret_64_caracteres_2
JWT_PASSWORD_RESET_SECRET=votre_secret_64_caracteres_3
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=30d

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxx
MAIL_FROM=votre@email.com

# Frontend URL
FRONTEND_URL=https://votre-domaine.com

# Gemini AI
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxx

# Cloudflare R2
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=remindy-documents

# Redis (Upstash)
REDIS_HOST=us1-xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxxxx
REDIS_DB=0
REDIS_TLS=true
CACHE_TTL=3600000
CACHE_NAMESPACE=remindy
```

4. Cliquez sur **"Save Changes"**

Render va automatiquement redéployer votre app avec les nouvelles variables.

---

### Étape 5 : Exécuter les migrations

Une fois le déploiement terminé :

1. Allez dans **"Shell"** (menu de gauche)
2. Cliquez sur **"Launch Shell"**
3. Exécutez :
   ```bash
   npm run migration:run
   ```

Ou utilisez la méthode "Manual Job" :

1. Allez dans votre service
2. **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Une fois déployé, allez dans **"Shell"**
4. Exécutez les migrations

---

### Étape 6 : Récupérer l'URL publique

Votre API est automatiquement disponible à :
```
https://remindy-api.onrender.com
```

Testez dans votre navigateur :
```
https://remindy-api.onrender.com/api
```

Vous devriez voir la documentation Swagger.

---

## Configuration avancée

### Activer les déploiements automatiques

1. **"Settings"** → **"Build & Deploy"**
2. **"Auto-Deploy"** : **"Yes"**

Maintenant, chaque push sur `main` déclenche un déploiement automatique.

### Configurer un domaine personnalisé (optionnel)

1. **"Settings"** → **"Custom Domain"**
2. Ajoutez votre domaine : `api.remindy.com`
3. Configurez les DNS selon les instructions Render
4. HTTPS automatique avec Let's Encrypt

### Désactiver le "sleep" (upgrade payant)

Le tier gratuit "s'endort" après 15 min d'inactivité.

**Solutions :**

**Option 1 : Pinger régulièrement (gratuit)**

Utilisez un service comme **UptimeRobot** :
1. [uptimerobot.com](https://uptimerobot.com) (gratuit)
2. Créez un monitor HTTP
3. URL : `https://remindy-api.onrender.com/api`
4. Interval : 5 minutes

**Option 2 : Passer au plan payant**
- Starter : $7/mois (pas de sleep, 512 MB RAM)

---

## Monitoring

### Logs en temps réel

1. Dashboard → Votre service
2. **"Logs"** (menu de gauche)
3. Logs en temps réel de votre application

### Métriques

1. **"Metrics"** (menu de gauche)
2. CPU, RAM, Réseau en temps réel

### Alertes

1. **"Settings"** → **"Notifications"**
2. Configurez les alertes email pour :
   - Déploiement échoué
   - Service down
   - Erreurs critiques

---

## Optimisation du tier gratuit

### 1. Réduire le temps de sleep

**Problème :** L'app s'endort après 15 min d'inactivité.

**Solution :** UptimeRobot ping toutes les 5 min (voir ci-dessus).

### 2. Optimiser les builds

**Problème :** Les builds peuvent prendre >5 min.

**Solution :** Utilisez le cache Docker :

Dans votre `Dockerfile`, assurez-vous que les dépendances sont cachées :

```dockerfile
# Déjà bon dans votre Dockerfile actuel
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

### 3. Réduire l'utilisation mémoire

**Problème :** Limite de 512 MB RAM.

**Solution :** Ajoutez ces variables d'environnement :

```env
NODE_OPTIONS=--max-old-space-size=460
```

---

## Limitations du tier gratuit

| Limite | Valeur | Impact |
|--------|--------|--------|
| **RAM** | 512 MB | OK pour NestJS léger |
| **CPU** | 0.1 partagé | Performance limitée |
| **Sleep** | 15 min inactivité | ⚠️ Redémarrage ~30 sec |
| **Build time** | 15 min max | OK pour votre projet |
| **Bandwidth** | 100 GB/mois | Largement suffisant |
| **PostgreSQL** | 1 GB stockage | Suffisant pour démarrer |
| **Redis** | 25 MB | Suffisant pour cache |

---

## Quand upgrader ?

Passez au plan payant ($7/mois) si :
- ❌ Le sleep vous dérange (UX mobile mauvaise)
- ❌ Vous avez >100 utilisateurs actifs
- ❌ Performance insuffisante (CPU limitée)

---

## Troubleshooting

### L'app ne démarre pas

**Vérifiez les logs** :
1. Dashboard → Logs
2. Cherchez les erreurs

**Causes courantes** :
- Variables d'environnement manquantes
- Migrations non exécutées
- Port incorrect (doit être celui fourni par Render)

**Solution :** Vérifiez que `backend/src/main.ts` utilise :
```typescript
const port = process.env.PORT || 3000;
```

### Erreur "Out of Memory"

**Cause :** Dépassement des 512 MB de RAM.

**Solution :**
1. Ajoutez `NODE_OPTIONS=--max-old-space-size=460`
2. Optimisez votre code (réduire les imports inutiles)
3. Ou passez au plan payant

### Sleep trop fréquent

**Cause :** App inactive >15 min.

**Solution :** UptimeRobot pour pinger toutes les 5 min (gratuit).

### Build trop long (>15 min)

**Cause :** Dépendances lourdes.

**Solution :**
1. Nettoyez `node_modules` avant de builder
2. Utilisez `npm ci` au lieu de `npm install`
3. Réduisez les devDependencies non nécessaires en prod

---

## Connexion avec l'APK mobile

### 1. Mettre à jour .env.production

Dans `frontend_mobile/.env.production` :
```env
EXPO_PUBLIC_API_URL=https://remindy-api.onrender.com
```

### 2. Rebuilder l'APK

```bash
cd frontend_mobile
eas build --platform android --profile production
```

### 3. Tester

Installez l'APK et testez :
- Inscription
- Connexion
- Upload de document
- Création de rappel

**Note :** Si l'app était en sleep, le premier appel peut prendre 30 secondes.

---

## Comparaison Render vs Railway

| Critère | Render (Free) | Railway ($5 crédit) |
|---------|---------------|---------------------|
| **Prix** | 0€ | $0 (~3 mois avec crédit) |
| **Sleep** | ⚠️ Oui (15 min) | ❌ Non |
| **RAM** | 512 MB | 512 MB |
| **CPU** | 0.1 | Partagé |
| **PostgreSQL** | ✅ Inclus (1GB) | ❌ Externe |
| **Redis** | ✅ Inclus (25MB) | ✅ Inclus |
| **Setup** | ⭐⭐⭐ Facile | ⭐⭐⭐⭐ Très facile |

**Recommandation :**
- **Render** : Si vous voulez VRAIMENT 0€ et acceptez le sleep
- **Railway** : Si vous voulez la meilleure expérience (pas de sleep)

---

## Checklist de déploiement

- [ ] Compte Render créé
- [ ] Services externes configurés (Neon, Upstash, R2, etc.)
- [ ] Web Service créé
- [ ] Variables d'environnement ajoutées
- [ ] Premier déploiement réussi
- [ ] Migrations exécutées
- [ ] API accessible : `https://remindy-api.onrender.com/api`
- [ ] UptimeRobot configuré (optionnel, pour éviter le sleep)
- [ ] App mobile mise à jour avec la nouvelle URL
- [ ] APK rebuilder avec EAS
- [ ] Tests fonctionnels OK

---

**Vous avez maintenant un backend NestJS déployé GRATUITEMENT sur Render !**

Si le sleep vous dérange, passez à Railway (voir `BACKEND_DEPLOYMENT_QUICKSTART.md`).
