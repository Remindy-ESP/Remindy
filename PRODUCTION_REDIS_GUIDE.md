# 🚀 Guide de Déploiement Redis en Production

Guide complet pour déployer Redis en production et scaler votre application Remindy.

---

## 📋 Table des Matières

1. [Options Redis en Production](#options-redis-en-production)
2. [Configuration Upstash (Recommandé)](#configuration-upstash)
3. [Configuration AWS ElastiCache](#configuration-aws-elasticache)
4. [Configuration Redis Cloud](#configuration-redis-cloud)
5. [Multi-Instance avec Load Balancer](#multi-instance-avec-load-balancer)
6. [Monitoring et Alertes](#monitoring-et-alertes)
7. [Backup et Disaster Recovery](#backup-et-disaster-recovery)
8. [Optimisations Production](#optimisations-production)

---

## 1. Options Redis en Production

### Comparaison des Services Managés

| Service | Prix | Latence | Scalabilité | Recommandation |
|---------|------|---------|-------------|----------------|
| **Upstash** | Free tier + pay-per-request | Très faible (edge) | Auto-scaling | ⭐ **Meilleur pour débuter** |
| **AWS ElastiCache** | ~$15/mois minimum | Faible | Manuelle | Production haute charge |
| **Redis Cloud** | ~$7/mois | Faible | Auto + Manuelle | Alternative solide |
| **Azure Cache** | ~$13/mois | Faible | Manuelle | Si déjà sur Azure |
| **Self-hosted** | Coût serveur | Variable | Manuelle | Maximum de contrôle |

---

## 2. Configuration Upstash (Recommandé)

### 2.1 Créer un Compte Upstash

1. Allez sur https://upstash.com
2. Créez un compte (GitHub login disponible)
3. Créez une nouvelle base Redis

### 2.2 Configuration

**Type** : Global (réplication multi-région)
**Region** : Europe (eu-central-1)
**TLS** : Activé par défaut

### 2.3 Récupérer les Credentials

Dans le dashboard Upstash, copiez :

```env
UPSTASH_REDIS_REST_URL=https://eu1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxx...
```

### 2.4 Mise à Jour de la Configuration

#### Option A: URL complète (Recommandé)

Modifiez `backend/.env` :

```env
# Redis Production (Upstash)
REDIS_URL=rediss://default:YOUR_PASSWORD@eu1-xxx.upstash.io:6379
REDIS_TLS=true
CACHE_TTL=3600000
CACHE_NAMESPACE=remindy-prod
```

#### Option B: REST API (Alternative)

Installez le client REST :

```bash
cd backend
npm install @upstash/redis
```

Créez `backend/src/infrastructure/config/upstash-redis.config.ts` :

```typescript
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

export const upstashRedisConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redis = new Redis({
      url: configService.get('UPSTASH_REDIS_REST_URL'),
      token: configService.get('UPSTASH_REDIS_REST_TOKEN'),
    });

    return {
      store: redis,
      ttl: configService.get<number>('CACHE_TTL', 3600000),
    };
  },
};
```

### 2.5 Avantages Upstash

- ✅ **Free tier généreux** : 10k commandes/jour
- ✅ **Pay-per-request** : Seulement ce que vous utilisez
- ✅ **Edge caching** : Réplication automatique
- ✅ **TLS inclus** : Sécurité par défaut
- ✅ **Serverless** : Pas de gestion serveur
- ✅ **Analytics** : Dashboard inclus

### 2.6 Coûts Estimés (Upstash)

**Free tier** :
- 10,000 commandes/jour
- 256 MB storage
- Parfait pour débuter

**Paid** :
- $0.2 par 100k commandes
- Exemple: 1M req/jour = ~$60/mois
- 10M req/jour = ~$600/mois

---

## 3. Configuration AWS ElastiCache

### 3.1 Créer un Cluster ElastiCache

```bash
# Via AWS CLI
aws elasticache create-cache-cluster \
  --cache-cluster-id remindy-redis-prod \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --engine-version 7.0 \
  --preferred-availability-zone eu-central-1a
```

### 3.2 Configuration VPC

**Important** : ElastiCache nécessite un VPC

1. Créez un **Security Group** autorisant le port 6379
2. Autorisez votre application (EC2, ECS, Lambda) à accéder

### 3.3 Variables d'Environnement

```env
# Redis AWS ElastiCache
REDIS_HOST=remindy-redis-prod.xxxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=          # Vide si AUTH désactivé
REDIS_TLS=true           # Si encryption in-transit activé
```

### 3.4 Réplication Multi-AZ

Pour la haute disponibilité :

```bash
aws elasticache create-replication-group \
  --replication-group-id remindy-redis-ha \
  --replication-group-description "HA Redis for Remindy" \
  --engine redis \
  --cache-node-type cache.t3.small \
  --num-cache-clusters 2 \
  --automatic-failover-enabled
```

### 3.5 Coûts Estimés (ElastiCache)

| Instance | vCPU | RAM | Prix/mois |
|----------|------|-----|-----------|
| cache.t3.micro | 2 | 0.5 GB | ~$12 |
| cache.t3.small | 2 | 1.37 GB | ~$24 |
| cache.t3.medium | 2 | 3.09 GB | ~$49 |
| cache.r6g.large | 2 | 13.07 GB | ~$140 |

---

## 4. Configuration Redis Cloud

### 4.1 Créer un Compte

1. https://redis.com/try-free/
2. Créez une base de données
3. Choisissez la région proche de vos utilisateurs

### 4.2 Variables d'Environnement

```env
REDIS_URL=rediss://default:PASSWORD@redis-xxxxx.c1.eu-central-1-1.ec2.cloud.redislabs.com:12345
REDIS_TLS=true
```

### 4.3 Avantages Redis Cloud

- ✅ Géré par les créateurs de Redis
- ✅ Features avancées (RedisJSON, RediSearch)
- ✅ Support professionnel
- ✅ Backups automatiques

---

## 5. Multi-Instance avec Load Balancer

### 5.1 Architecture Scalable

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (AWS ALB /    │
                    │   Nginx)        │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌─────▼──────┐   ┌─────▼──────┐
    │  Instance 1 │   │ Instance 2 │   │ Instance N │
    │  NestJS:    │   │ NestJS:    │   │ NestJS:    │
    │  8080       │   │ 8080       │   │ 8080       │
    └──────┬──────┘   └─────┬──────┘   └─────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Cloud    │
                    │  (Upstash /     │
                    │   ElastiCache)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │     (Neon)      │
                    └─────────────────┘
```

### 5.2 Configuration Nginx Load Balancer

Créez `/etc/nginx/sites-available/remindy` :

```nginx
upstream remindy_backend {
    least_conn;  # Load balance basé sur les connexions
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.remindy.app;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.remindy.app;

    ssl_certificate /etc/letsencrypt/live/api.remindy.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.remindy.app/privkey.pem;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://remindy_backend;
        proxy_http_version 1.1;

        # Headers pour WebSocket (si nécessaire)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Headers pour l'IP réelle
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://remindy_backend;
    }
}
```

### 5.3 Configuration AWS Application Load Balancer

```bash
# Créer un target group
aws elbv2 create-target-group \
  --name remindy-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health \
  --health-check-interval-seconds 30

# Créer le load balancer
aws elbv2 create-load-balancer \
  --name remindy-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx
```

### 5.4 Docker Compose Multi-Instance (Dev)

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - '6379:6379'

  app1:
    build: ./backend
    environment:
      - REDIS_HOST=redis
      - NODE_ENV=production
    depends_on:
      - redis

  app2:
    build: ./backend
    environment:
      - REDIS_HOST=redis
      - NODE_ENV=production
    depends_on:
      - redis

  app3:
    build: ./backend
    environment:
      - REDIS_HOST=redis
      - NODE_ENV=production
    depends_on:
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2
      - app3
```

---

## 6. Monitoring et Alertes

### 6.1 Métriques Redis à Surveiller

| Métrique | Description | Seuil Alerte |
|----------|-------------|--------------|
| `used_memory` | Mémoire utilisée | > 80% |
| `connected_clients` | Clients connectés | > 90% du max |
| `keyspace_hits` vs `keyspace_misses` | Hit rate | < 70% |
| `evicted_keys` | Clés évincées | > 0 |
| `rejected_connections` | Connexions rejetées | > 0 |
| `ops_per_sec` | Opérations/sec | Baseline |

### 6.2 Datadog Integration

```typescript
// backend/src/infrastructure/monitoring/datadog.config.ts
import { StatsD } from 'hot-shots';

export const datadogClient = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'remindy.',
  globalTags: {
    env: process.env.NODE_ENV,
    service: 'remindy-api',
  },
});

// Dans CacheService
async get<T>(key: string): Promise<T | null> {
  const start = Date.now();
  const value = await this.cacheManager.get<T>(key);

  const duration = Date.now() - start;
  datadogClient.timing('cache.get.duration', duration);

  if (value !== null) {
    datadogClient.increment('cache.hit');
  } else {
    datadogClient.increment('cache.miss');
  }

  return value;
}
```

### 6.3 Prometheus + Grafana

```typescript
// backend/src/main.ts
import { register, Counter, Histogram } from 'prom-client';

const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
});

const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
});

const cacheDuration = new Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Duration of cache operations',
});

// Endpoint /metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 6.4 CloudWatch (AWS)

```bash
# Créer une alarme pour la mémoire Redis
aws cloudwatch put-metric-alarm \
  --alarm-name remindy-redis-high-memory \
  --alarm-description "Redis memory > 80%" \
  --metric-name DatabaseMemoryUsagePercentage \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 7. Backup et Disaster Recovery

### 7.1 Redis Persistence

Redis offre 2 modes de persistance :

#### RDB (Snapshot)

```redis
# redis.conf
save 900 1      # Snapshot après 900s si 1 clé modifiée
save 300 10     # Snapshot après 300s si 10 clés modifiées
save 60 10000   # Snapshot après 60s si 10k clés modifiées
```

#### AOF (Append Only File)

```redis
# redis.conf
appendonly yes
appendfsync everysec  # Flush toutes les secondes
```

### 7.2 Backup Automatique (Upstash)

- ✅ Backups automatiques quotidiens
- ✅ Rétention 7 jours (Free tier)
- ✅ Rétention 30 jours (Paid)

### 7.3 Backup Manuel

```bash
# Via Redis CLI
redis-cli -h your-redis-host.com -p 6379 -a password BGSAVE

# Copier le dump.rdb
docker cp remindy-redis:/data/dump.rdb ./backups/redis-backup-$(date +%Y%m%d).rdb
```

### 7.4 Restore depuis Backup

```bash
# Arrêter Redis
docker-compose stop redis

# Copier le backup
docker cp ./backups/redis-backup-20260111.rdb remindy-redis:/data/dump.rdb

# Redémarrer Redis
docker-compose start redis
```

---

## 8. Optimisations Production

### 8.1 Configuration Redis Optimale

```redis
# /etc/redis/redis.conf

# Mémoire
maxmemory 2gb
maxmemory-policy allkeys-lru  # Évincer les clés LRU

# Persistance
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 60

# Sécurité
requirepass YOUR_STRONG_PASSWORD
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

### 8.2 Optimisations NestJS

```typescript
// backend/src/infrastructure/config/redis.config.ts
export const redisConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    // Configuration de production optimisée
    return {
      store: await redisStore({
        socket: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          tls: configService.get('REDIS_TLS') === 'true',
        },
        password: configService.get('REDIS_PASSWORD'),

        // Pool de connexions
        connectionPoolSize: 10,

        // Retry strategy
        retryStrategy: (times: number) => {
          if (times > 10) {
            return null; // Abandonner après 10 tentatives
          }
          return Math.min(times * 100, 3000);
        },

        // Timeouts
        connectTimeout: 10000,
        commandTimeout: 5000,

        // Keep-alive
        keepAlive: 30000,

        // Compression (si beaucoup de données)
        enableOfflineQueue: false,
      }),

      ttl: configService.get<number>('CACHE_TTL', 3600000),
    };
  },
};
```

### 8.3 Stratégie de Cache par Type de Données

```typescript
// TTL recommandés par type de donnée
const CACHE_TTL = {
  // Très volatile (change souvent)
  userSession: 86400,         // 24h
  refreshToken: 2592000,      // 30j

  // Modérément volatile
  userProfile: 3600,          // 1h
  subscriptions: 1800,        // 30min
  events: 900,                // 15min

  // Stable (change rarement)
  categories: 86400,          // 24h
  preferences: 43200,         // 12h
  roles: 86400,               // 24h

  // Static (jamais ou presque)
  appConfig: 604800,          // 7j
};
```

### 8.4 Compression des Données

```typescript
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

async set<T>(key: string, value: T, ttl?: number): Promise<void> {
  const json = JSON.stringify(value);

  // Compresser si > 1KB
  if (json.length > 1024) {
    const compressed = await gzipAsync(json);
    await this.cacheManager.set(`${key}:gz`, compressed, ttl);
  } else {
    await this.cacheManager.set(key, value, ttl);
  }
}
```

---

## ✅ Checklist Déploiement Production

### Avant le Déploiement

- [ ] Redis production configuré (Upstash/ElastiCache)
- [ ] Variables d'environnement mises à jour
- [ ] TLS/SSL activé
- [ ] Password fort configuré
- [ ] Tests de charge validés (10k req/min)
- [ ] Monitoring configuré (Datadog/CloudWatch)
- [ ] Alertes créées (mémoire, latence, erreurs)
- [ ] Backup automatique activé
- [ ] Plan de rollback documenté

### Pendant le Déploiement

- [ ] Déployer en blue-green ou canary
- [ ] Monitorer les métriques en temps réel
- [ ] Vérifier le cache hit rate > 80%
- [ ] Vérifier p95 latence < 200ms
- [ ] Pas d'erreurs dans les logs

### Après le Déploiement

- [ ] Tests de santé validés
- [ ] Load test léger en production
- [ ] Métriques sauvegardées (baseline)
- [ ] Documentation mise à jour
- [ ] Équipe informée des changements

---

## 🎉 Résultat Attendu

Avec Redis correctement configuré en production :

- ✅ **Latence divisée par 10-50** (p95 < 100ms)
- ✅ **Throughput multiplié par 20** (10k req/min)
- ✅ **Charge DB réduite de 80-90%**
- ✅ **Scalabilité horizontale** (multi-instance)
- ✅ **Haute disponibilité** (99.9% uptime)
- ✅ **Coûts optimisés** (moins de DB queries)

**Votre application est maintenant prête à scaler ! 🚀**
