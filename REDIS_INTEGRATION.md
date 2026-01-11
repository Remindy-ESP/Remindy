# 🚀 Intégration Redis - Guide Complet

## ✅ Statut de l'Implémentation

Redis a été entièrement intégré dans votre projet Remindy avec les fonctionnalités suivantes :

### Fonctionnalités Implémentées

- ✅ **Configuration Redis** - Configuration complète avec Keyv et cache-manager v7
- ✅ **Service de Cache Générique** - `CacheService` disponible globalement
- ✅ **Cache de Session** - Les sessions utilisateur sont cachées pour réduire la charge DB
- ✅ **Repository Optimisé** - `UserSessionTypeOrmRepository` utilise le cache Redis
- ✅ **Docker Compose** - Redis + Redis Commander pour le développement local
- ✅ **Variables d'Environnement** - Configuration complète dans `.env`

---

## 📋 Prérequis

1. **Docker Desktop** installé et démarré
2. **Node.js** v18+ et npm
3. **PostgreSQL** (Neon ou local)

---

## 🚀 Démarrage Rapide

### 1. Démarrer Redis avec Docker

```bash
# Démarrer uniquement Redis
docker-compose up -d redis

# Démarrer Redis + Redis Commander (interface web)
docker-compose up -d redis redis-commander

# Vérifier que Redis fonctionne
docker-compose ps
```

**Accès Redis Commander** : http://localhost:8081

### 2. Installer les Dépendances (déjà fait)

```bash
cd backend
npm install
```

### 3. Vérifier les Variables d'Environnement

Le fichier `backend/.env` contient déjà :

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=dev_password
REDIS_DB=0
REDIS_TLS=false
CACHE_TTL=3600000        # 1 heure en ms
CACHE_NAMESPACE=remindy
```

### 4. Démarrer l'Application

```bash
cd backend
npm run start:dev
```

### 5. Tester l'Intégration Redis

#### Test 1: Connexion Redis

Vous devriez voir dans les logs au démarrage :
```
[CacheService] Cache module initialized with Redis
```

#### Test 2: Cache de Session

1. **Créer un compte** ou **Se connecter**
   ```bash
   curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!"
     }'
   ```

2. **Vérifier dans Redis Commander** (http://localhost:8081)
   - Recherchez une clé du type : `remindy:session:token:xxx`
   - Elle devrait apparaître avec un TTL

3. **Utiliser le refresh token**
   ```bash
   curl -X POST http://localhost:8080/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{
       "refreshToken": "YOUR_REFRESH_TOKEN"
     }'
   ```

4. **Vérifier les logs**
   - Premier appel : `Cache MISS for session with token hash`
   - Second appel : `Cache HIT for session with token hash`

---

## 📊 Architecture Redis Implémentée

```
┌─────────────────────────────────────────────────┐
│         Application Layer                       │
│  (Controllers, Use Cases)                       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│      SessionCacheService                        │
│  - cacheSession()                               │
│  - getSession()                                 │
│  - invalidateSession()                          │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│      CacheService (Global)                      │
│  - get<T>()                                     │
│  - set<T>()                                     │
│  - getOrSet<T>()                                │
│  - del()                                        │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│      Redis (via Keyv)                           │
│  - Stockage clé-valeur                          │
│  - TTL automatique                              │
│  - Persistance sur disque                       │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Métriques à Surveiller

### Cache Hit Rate (Taux de succès du cache)

Dans les logs, comptez :
- **Cache HIT** = Donnée trouvée dans Redis
- **Cache MISS** = Donnée non trouvée, requête DB

**Objectif** : > 80% de HIT rate après quelques minutes d'utilisation

### Latence des Requêtes

Avant Redis :
- Validation de token : ~50-100ms (requête DB)

Après Redis :
- Validation de token : ~2-5ms (lecture cache)

**Gain attendu** : **10-50x plus rapide** sur les requêtes authentifiées

---

## 🛠️ Commandes Utiles

### Docker

```bash
# Voir les logs Redis
docker-compose logs -f redis

# Redémarrer Redis
docker-compose restart redis

# Arrêter Redis
docker-compose down

# Supprimer les données Redis
docker-compose down -v
```

### Redis CLI (dans le conteneur)

```bash
# Accéder au CLI Redis
docker exec -it remindy-redis redis-cli -a dev_password

# Lister toutes les clés
KEYS remindy:*

# Voir une clé spécifique
GET remindy:session:token:xxx

# Voir le TTL d'une clé
TTL remindy:session:token:xxx

# Supprimer toutes les clés
FLUSHDB

# Statistiques Redis
INFO stats
```

---

## 📈 Prochaines Étapes (Optimisations Futures)

### Phase 2: Cache des Données Métier

Vous pouvez maintenant facilement cacher d'autres données :

#### 1. Cache des Catégories

```typescript
// Dans CategoryRepository
async findByUser(userId: number): Promise<Category[]> {
  const cacheKey = this.cacheService.buildKey('user', userId, 'categories');

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const entities = await this.repo.find({ where: { userId } });
      return entities.map(CategoryMapper.toDomain);
    },
    3600 // 1 heure
  );
}
```

#### 2. Cache des Subscriptions

```typescript
// Dans SubscriptionRepository
async findByUserId(userId: number): Promise<Subscription[]> {
  const cacheKey = this.cacheService.buildKey('user', userId, 'subscriptions');

  return this.cacheService.getOrSet(cacheKey,
    () => this.fetchFromDatabase(userId),
    1800 // 30 minutes
  );
}
```

#### 3. Cache des Préférences Utilisateur

```typescript
// Dans UserPreferenceRepository
async findByUserId(userId: number): Promise<UserPreference> {
  const cacheKey = this.cacheService.buildKey('user', userId, 'preferences');

  return this.cacheService.getOrSet(cacheKey,
    () => this.repo.findOne({ where: { userId } }),
    86400 // 24 heures
  );
}
```

### Phase 3: Migration vers Bull (Queue Redis)

Pour remplacer `InMemoryQueueService` par une queue persistante :

```bash
# Installer Bull
npm install @nestjs/bull bull

# Créer la configuration Bull
# Voir la documentation fournie précédemment
```

---

## 🔒 Production

### Configuration Redis en Production

Utilisez un service Redis managé :

- **Upstash** (Recommandé pour débuter)
  - https://upstash.com
  - Free tier : 10k commandes/jour
  - Configuration SSL/TLS automatique

- **AWS ElastiCache**
  - Redis haute disponibilité
  - Multi-AZ pour la résilience

- **Redis Cloud** (Redis Labs)
  - Redis officiel managé

### Variables d'Environnement Production

```env
# Production avec Upstash
REDIS_URL=rediss://default:xxx@us1-xxx.upstash.io:6379
REDIS_TLS=true
CACHE_TTL=3600000
```

### Déploiement Multi-Instance

Avec Redis, vous pouvez maintenant :
- ✅ Scaler horizontalement (plusieurs instances NestJS)
- ✅ Partager les sessions entre instances
- ✅ Load balancer avec Nginx/AWS ALB

---

## 📝 Tests de Charge

### Installation Artillery

```bash
npm install -g artillery
```

### Créer un Scénario de Test

Créez `load-tests/redis-test.yml` :

```yaml
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 100  # 100 req/s = 6000 req/min
      name: 'Test cache Redis'

scenarios:
  - name: 'Authenticated Requests'
    flow:
      - post:
          url: '/auth/login'
          json:
            email: 'test@example.com'
            password: 'Test123!'
          capture:
            - json: '$.accessToken'
              as: 'token'

      - get:
          url: '/subscriptions'
          headers:
            Authorization: 'Bearer {{ token }}'

      - get:
          url: '/events'
          headers:
            Authorization: 'Bearer {{ token }}'
```

### Exécuter le Test

```bash
artillery run load-tests/redis-test.yml
```

**Résultats attendus** :
- p95 < 100ms (avec cache)
- p99 < 200ms
- 0% d'erreurs
- Cache hit rate > 80%

---

## ❓ FAQ & Troubleshooting

### Redis ne démarre pas

```bash
# Vérifier que Docker Desktop est lancé
docker --version

# Vérifier les logs
docker-compose logs redis

# Redémarrer complètement
docker-compose down
docker-compose up -d redis
```

### L'application ne se connecte pas à Redis

1. Vérifier que Redis est accessible :
   ```bash
   docker exec -it remindy-redis redis-cli -a dev_password ping
   # Devrait retourner: PONG
   ```

2. Vérifier les variables d'environnement :
   ```bash
   cd backend
   cat .env | grep REDIS
   ```

3. Vérifier les logs de l'application :
   - Rechercher "Redis connection error"

### Cache ne fonctionne pas

1. Activer les logs de debug dans `CacheService`
2. Vérifier dans Redis Commander que les clés sont créées
3. Tester manuellement :
   ```typescript
   // Dans un controller de test
   @Get('/test-cache')
   async testCache() {
     await this.cacheService.set('test', 'value', 60);
     const value = await this.cacheService.get('test');
     return { value };
   }
   ```

### Performances pas meilleures

- Vérifier le cache hit rate (doit être > 70%)
- Vérifier la latence réseau vers Redis (< 5ms)
- Vérifier que les données sont bien cachées (Redis Commander)

---

## 📚 Ressources

- **Redis Documentation** : https://redis.io/docs/
- **cache-manager** : https://github.com/jaredwray/cacheable
- **Keyv** : https://github.com/jaredwray/keyv
- **Bull Queue** : https://docs.bullmq.io/

---

## ✅ Checklist de Validation

Avant de passer en production :

- [ ] Redis fonctionne en local avec Docker
- [ ] Les sessions sont cachées (vérifier dans Redis Commander)
- [ ] Cache hit rate > 80% après 5 minutes d'utilisation
- [ ] Latence p95 < 200ms
- [ ] Tests de charge : 6000 req/min sans erreur
- [ ] Configuration Redis production (Upstash/ElastiCache)
- [ ] Monitoring en place (logs, métriques)
- [ ] Documentation équipe à jour

---

## 🎉 Félicitations !

Vous avez maintenant une application **scalable** avec :
- ✅ Cache distribué Redis
- ✅ Sessions performantes (10-50x plus rapide)
- ✅ Prêt pour le multi-instance
- ✅ Base solide pour ajouter Bull Queue

**Impact attendu** :
- Réduction de 80-90% des requêtes DB sur les endpoints authentifiés
- Latence divisée par 10-50 sur la validation de tokens
- Capacité de scaler à 10k+ requêtes/min par instance
