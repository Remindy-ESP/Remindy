# 🚀 Quick Start - Redis Integration

## ✅ Corrections Appliquées

Les erreurs TypeScript ont été corrigées :

1. **Import Type** : Utilisation de `import type { Cache }` pour compatibilité avec les décorateurs
2. **Méthode reset()** : Remplacée par un warning (non disponible en cache-manager v7)
3. **Configuration KeyvRedis** : Simplifiée pour compatibilité avec @keyv/redis

## 🏃 Démarrage Rapide

### 1. Démarrer Redis

```bash
# Assurez-vous que Docker Desktop est lancé, puis :
docker-compose up -d redis redis-commander
```

**Vérification** :
- Redis : `docker ps` devrait montrer `remindy-redis` running
- Redis Commander : http://localhost:8081

### 2. Démarrer l'Application

```bash
cd backend
npm run start:dev
```

**Logs attendus** :
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] CacheModule dependencies initialized
[Nest] INFO [InstanceLoader] InfrastructureModule dependencies initialized
```

### 3. Tester le Cache

#### Option A: Via l'API

```bash
# 1. Créer un utilisateur de test
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# 2. Se connecter (cache la session)
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Vous recevrez un accessToken et refreshToken
# Copiez l'accessToken

# 3. Utiliser l'API (devrait être très rapide)
curl -X GET http://localhost:8080/subscriptions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Vérifier dans Redis Commander
# → Allez sur http://localhost:8081
# → Recherchez les clés "remindy:session:token:*"
```

#### Option B: Vérifier Redis en CLI

```bash
# Accéder au CLI Redis
docker exec -it remindy-redis redis-cli -a dev_password

# Lister les clés
KEYS remindy:*

# Voir une clé spécifique
GET remindy:session:token:xxxxx

# Voir le TTL (temps restant)
TTL remindy:session:token:xxxxx

# Quitter
EXIT
```

---

## 📊 Vérifier les Performances

### Activer les Logs de Debug

Dans `backend/src/infrastructure/cache/cache.service.ts`, les logs de debug sont déjà activés :

```typescript
this.logger.debug(`Cache HIT: ${key}`);   // Donnée trouvée
this.logger.debug(`Cache MISS: ${key}`);  // Donnée non trouvée
```

### Surveiller le Cache Hit Rate

Dans les logs, vous devriez voir :

**Premier appel** (Cache MISS) :
```
[CacheService] Cache MISS: session:token:abc123
[SessionCacheService] Cache MISS for session with token hash
```

**Appels suivants** (Cache HIT) :
```
[CacheService] Cache HIT: session:token:abc123
[SessionCacheService] Cache HIT for session with token hash
```

**Objectif** : > 80% de Cache HIT après quelques minutes d'utilisation

---

## 🔍 Vérification des Fichiers Modifiés

### Fichiers Créés

- ✅ `backend/src/infrastructure/config/redis.config.ts`
- ✅ `backend/src/infrastructure/cache/cache.service.ts`
- ✅ `backend/src/infrastructure/cache/index.ts`
- ✅ `backend/src/modules/auth/infrastructure/services/session-cache.service.ts`

### Fichiers Modifiés

- ✅ `backend/src/app.module.ts` → CacheModule ajouté
- ✅ `backend/src/infrastructure/infrastructure.module.ts` → CacheService global
- ✅ `backend/src/modules/auth/auth.module.ts` → SessionCacheService
- ✅ `backend/src/modules/auth/.../user-session-typeorm.repository.ts`
- ✅ `backend/.env` → Variables Redis

### Dépendances Installées

- ✅ `ioredis`
- ✅ `keyv`
- ✅ `@keyv/redis`
- ✅ `@nestjs/bull`
- ✅ `bull`

---

## 🐛 Troubleshooting

### Erreur: "Cannot connect to Redis"

**Cause** : Redis n'est pas démarré

**Solution** :
```bash
# Vérifier Docker
docker ps

# Démarrer Redis
docker-compose up -d redis

# Voir les logs
docker-compose logs redis
```

### Erreur: "NOAUTH Authentication required"

**Cause** : Mauvais mot de passe Redis

**Solution** : Vérifiez `.env` :
```env
REDIS_PASSWORD=dev_password
```

### Cache ne fonctionne pas

**Diagnostic** :
1. Vérifier Redis Commander : http://localhost:8081
2. Chercher des clés `remindy:*`
3. Vérifier les logs de l'application

**Si aucune clé n'apparaît** :
- Redis n'est pas connecté
- Vérifier les variables d'environnement

**Si les clés existent mais pas de Cache HIT** :
- TTL trop court (vérifié avec `TTL key`)
- Clés différentes (vérifier le format)

---

## 📈 Étapes Suivantes

### 1. Tests de Performance Basiques

```bash
# Installer Apache Bench (inclus avec Apache)
# Windows: Télécharger Apache httpd

# Test simple : 1000 requêtes avec 10 en parallèle
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:8080/subscriptions
```

**Résultats attendus** :
- Temps/requête : < 50ms (moyenne)
- Requests/sec : > 200

### 2. Tests de Charge Complets

Voir `load-tests/README.md` pour :
- Artillery : Tests simples et rapides
- k6 : Tests avancés avec métriques

### 3. Ajouter Cache à d'autres Modules

Vous pouvez maintenant facilement cacher d'autres données :

**Exemple : Categories**

```typescript
// Dans CategoryRepository
constructor(
  @InjectRepository(CategoryEntity)
  private readonly repository: Repository<CategoryEntity>,
  private readonly cacheService: CacheService,  // Injecter
) {}

async findByUser(userId: number): Promise<Category[]> {
  const cacheKey = this.cacheService.buildKey('user', userId, 'categories');

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const entities = await this.repository.find({ where: { userId } });
      return entities.map(CategoryMapper.toDomain);
    },
    3600 // 1 heure
  );
}
```

### 4. Migration Bull Queue

Pour remplacer `InMemoryQueueService` :
- Voir `REDIS_INTEGRATION.md` section "Phase 3"
- Configuration Bull avec Redis
- Jobs persistants et scalables

---

## 🎯 Checklist de Validation

Avant de considérer Redis comme opérationnel :

- [ ] Docker Desktop démarré
- [ ] Redis container running (`docker ps`)
- [ ] Redis Commander accessible (http://localhost:8081)
- [ ] Application démarre sans erreur
- [ ] Login fonctionne et crée une session
- [ ] Clés visibles dans Redis Commander
- [ ] Logs montrent "Cache HIT" après quelques requêtes
- [ ] Performance améliorée (requêtes < 50ms)

---

## 📚 Documentation Complète

- **REDIS_INTEGRATION.md** : Guide complet d'utilisation
- **PRODUCTION_REDIS_GUIDE.md** : Déploiement production
- **load-tests/README.md** : Tests de charge

---

## 🎉 Statut

Redis est maintenant :
- ✅ Installé et configuré
- ✅ Intégré avec NestJS
- ✅ Cache de session actif
- ✅ Prêt pour les tests de charge
- ✅ Compatible TypeScript (erreurs corrigées)

**Votre application est prête à scaler ! 🚀**
