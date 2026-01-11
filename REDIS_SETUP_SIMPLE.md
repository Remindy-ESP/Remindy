# Configuration Redis Simple - Sans Load Balancer

## Tu n'as PAS besoin de load balancer pour Redis

Pour ton application Remindy, une seule instance Redis suffit. Les services managés gèrent automatiquement la haute disponibilité.

---

## Option 1 : Upstash (Recommandé - Gratuit)

### Pourquoi Upstash ?
- ✅ Gratuit (10,000 commandes/jour)
- ✅ Réplication automatique (haute disponibilité)
- ✅ Pas de configuration complexe
- ✅ TLS/SSL inclus
- ✅ Backups automatiques
- ✅ Global (faible latence partout)

### Configuration en 3 minutes

#### 1. Créer un compte
1. Allez sur [upstash.com](https://upstash.com)
2. Créez un compte (gratuit)

#### 2. Créer une base Redis
1. Dashboard → "Create Database"
2. Configuration :
   - **Name** : `remindy-cache`
   - **Region** : Choisissez le plus proche (ex: `eu-west-1`)
   - **Type** : `Regional` (gratuit)
   - **Eviction** : `noeviction` (ne supprime pas les données)

3. Cliquez sur "Create"

#### 3. Récupérer les credentials

Une fois créé, vous verrez :

```
UPSTASH_REDIS_REST_URL=https://us1-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXxxxxxxxxxxxxxxxxxxxx
```

Mais pour ioredis (utilisé par NestJS), vous avez besoin de :

Cliquez sur l'onglet **"Properties"** :
- **Endpoint** : `us1-xxxxx.upstash.io` → c'est votre `REDIS_HOST`
- **Port** : `6379` → c'est votre `REDIS_PORT`
- **Password** : `AXXXXxxxxxxxxxxxxxxxxxxxx` → c'est votre `REDIS_PASSWORD`

#### 4. Variables d'environnement

Dans votre plateforme de déploiement (Railway, Render, etc.), ajoutez :

```env
REDIS_HOST=us1-xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AXXXXxxxxxxxxxxxxxxxxxxxx
REDIS_DB=0
REDIS_TLS=true
CACHE_TTL=3600000
CACHE_NAMESPACE=remindy
```

**IMPORTANT : `REDIS_TLS=true`** car Upstash utilise TLS obligatoirement.

#### 5. C'est tout !

Votre application va automatiquement se connecter à Upstash. Pas de load balancer, pas de configuration complexe.

---

## Option 2 : Railway Redis

### Pourquoi Railway Redis ?
- ✅ Intégré directement dans Railway
- ✅ Configuration automatique
- ✅ Variables d'environnement auto-générées
- ❌ Payant ($5/mois inclus dans Railway)

### Configuration en 1 minute

Si vous déployez déjà sur Railway :

#### 1. Ajouter Redis au projet
1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"Add Redis"**
3. Railway crée automatiquement l'instance

#### 2. Variables d'environnement

Railway génère automatiquement :
- `REDIS_URL` (format : `redis://default:password@host:port`)

Vous devez extraire les valeurs pour votre `.env` :

```env
# Railway génère automatiquement ces variables
# Vous n'avez rien à faire !
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
REDIS_PASSWORD=xxxxxxxxxx
REDIS_DB=0
REDIS_TLS=false
CACHE_TTL=3600000
CACHE_NAMESPACE=remindy
```

**NOTE : `REDIS_TLS=false`** car Redis interne Railway n'utilise pas TLS.

#### 3. C'est tout !

Railway connecte automatiquement votre API au Redis.

---

## Option 3 : Redis Cloud (Alternatif gratuit)

### Pourquoi Redis Cloud ?
- ✅ Gratuit jusqu'à 30MB
- ✅ Réplication automatique
- ✅ Support officiel Redis

### Configuration

1. Allez sur [redis.com/try-free](https://redis.com/try-free/)
2. Créez un compte
3. Create database → Free plan
4. Récupérez les credentials :
   - **Endpoint** → `REDIS_HOST`
   - **Port** → `REDIS_PORT` (généralement 6379)
   - **Password** → `REDIS_PASSWORD`

5. Variables d'environnement :
```env
REDIS_HOST=redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=6379
REDIS_PASSWORD=xxxxxxxxxx
REDIS_DB=0
REDIS_TLS=true
CACHE_TTL=3600000
CACHE_NAMESPACE=remindy
```

---

## Comparaison rapide

| Service | Prix | Limite gratuite | TLS | Setup |
|---------|------|----------------|-----|-------|
| **Upstash** | Gratuit | 10k req/jour | Oui | 3 min |
| **Railway Redis** | $5/mois | - | Non | 1 min |
| **Redis Cloud** | Gratuit | 30MB | Oui | 5 min |

**Recommandation : Upstash** pour rester dans le tier gratuit et avoir une excellente performance.

---

## Vérifier la configuration

### 1. Script de test local

Créez un fichier `backend/test-redis.js` :

```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

redis.on('connect', () => {
  console.log('✅ Redis connecté avec succès !');

  // Test d'écriture/lecture
  redis.set('test-key', 'Hello Remindy!')
    .then(() => redis.get('test-key'))
    .then(value => {
      console.log('✅ Test lecture/écriture OK:', value);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Erreur:', err);
      process.exit(1);
    });
});

redis.on('error', (err) => {
  console.error('❌ Erreur de connexion Redis:', err);
  process.exit(1);
});
```

### 2. Tester

```bash
cd backend
node test-redis.js
```

Vous devriez voir :
```
✅ Redis connecté avec succès !
✅ Test lecture/écriture OK: Hello Remindy!
```

### 3. Tester en production

```bash
# Railway
railway run node test-redis.js

# Fly.io
fly ssh console -C "node test-redis.js"

# Render
# Via le shell du dashboard
```

---

## Monitoring Redis

### Upstash Dashboard
- Allez sur [console.upstash.com](https://console.upstash.com)
- Sélectionnez votre base Redis
- Onglet **"Metrics"** :
  - Nombre de commandes
  - Latence
  - Utilisation mémoire
  - Connexions actives

### Railway Dashboard
- Projet → Redis service
- Onglet **"Metrics"** :
  - CPU
  - RAM
  - Connexions

### Redis CLI (debug)

Pour Upstash :
```bash
redis-cli -h us1-xxxxx.upstash.io -p 6379 --tls -a votre_password
```

Pour Railway (depuis le projet) :
```bash
railway run redis-cli
```

Commandes utiles :
```redis
PING                    # Vérifier la connexion
INFO                    # Infos système
DBSIZE                  # Nombre de clés
KEYS remindy:*         # Lister les clés Remindy
GET remindy:key        # Lire une valeur
FLUSHDB                # ⚠️ DANGER : Vider la base
```

---

## Architecture finale (sans load balancer Redis)

```
┌────────────────────────────────────────────────────┐
│  APK MOBILE                                         │
└────────────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────┐
│  PLATEFORME (Railway/Render/Fly.io)                │
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │  Load Balancer (automatique)             │     │
│  └──────────────────────────────────────────┘     │
│                     │                              │
│                     ▼                              │
│  ┌──────────────────────────────────────────┐     │
│  │  API Backend (1 ou plusieurs instances)  │     │
│  │  - NestJS                                 │     │
│  │  - Bull Queue (OCR jobs)                 │     │
│  └──────────────────────────────────────────┘     │
│                     │                              │
│                     │ (connexion directe)         │
│                     ▼                              │
│  ┌──────────────────────────────────────────┐     │
│  │  REDIS (1 instance)                       │     │
│  │  - Upstash (externe, managé)              │     │
│  │  OU                                       │     │
│  │  - Railway Redis (interne)                │     │
│  │                                           │     │
│  │  ✅ Réplication automatique par le service│     │
│  │  ✅ Pas besoin de load balancer          │     │
│  └──────────────────────────────────────────┘     │
└────────────────────────────────────────────────────┘
```

---

## FAQ

### Q: Pourquoi pas de load balancer pour Redis ?
**R:** Votre API se connecte directement à Redis. Redis est ultra-rapide (< 1ms de latence) et peut gérer des milliers de requêtes/seconde avec une seule instance. Les services managés (Upstash, Railway) gèrent automatiquement la haute disponibilité avec réplication.

### Q: Et si Redis tombe en panne ?
**R:**
- **Upstash** : Réplication automatique, failover automatique
- **Railway** : Auto-restart si crash
- **Redis Cloud** : Réplication multi-AZ

Votre application continue de fonctionner, avec juste un léger ralentissement le temps de la reconnexion (1-2 secondes max).

### Q: Quand aurai-je besoin de plusieurs instances Redis ?
**R:** Seulement si vous avez :
- Plus de **100,000 utilisateurs actifs simultanément**
- Plus de **10,000 requêtes/seconde** vers Redis
- Besoin de **distribution géographique** (multi-régions)

Pour Remindy, vous êtes très loin de ça. Une instance Upstash gratuite suffit largement.

### Q: Mon API a plusieurs instances, Redis peut suivre ?
**R:** Oui ! Plusieurs instances de votre API peuvent se connecter à la même instance Redis sans problème. Redis est fait pour ça.

```
API Instance 1 ──┐
API Instance 2 ──┼──> REDIS (1 instance)
API Instance 3 ──┘
```

---

## Checklist de configuration

- [ ] Compte Upstash créé (ou Redis sur Railway)
- [ ] Base Redis créée
- [ ] Variables d'environnement configurées :
  - [ ] `REDIS_HOST`
  - [ ] `REDIS_PORT`
  - [ ] `REDIS_PASSWORD`
  - [ ] `REDIS_DB=0`
  - [ ] `REDIS_TLS=true` (Upstash) ou `false` (Railway)
  - [ ] `CACHE_TTL=3600000`
  - [ ] `CACHE_NAMESPACE=remindy`
- [ ] Test de connexion réussi (`node test-redis.js`)
- [ ] Backend redéployé avec les nouvelles variables
- [ ] Vérification dans les logs : pas d'erreur Redis
- [ ] Test upload de document (utilise Bull Queue + Redis)

---

## Support

- **Upstash** : [docs.upstash.com/redis](https://docs.upstash.com/redis)
- **Railway Redis** : [docs.railway.app/databases/redis](https://docs.railway.app/databases/redis)
- **ioredis** : [github.com/redis/ioredis](https://github.com/redis/ioredis)

---

**Conclusion : Utilisez Upstash (gratuit) et oubliez les load balancers pour Redis. Tout est géré automatiquement.**
