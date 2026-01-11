# 📈 Tests de Charge - Remindy

Ce dossier contient les scripts pour tester les performances de l'application sous charge.

## 🎯 Objectifs des Tests

- **Valider la scalabilité** : Supporter 10k requêtes/minute
- **Mesurer l'impact du cache Redis** : Vérifier le taux de cache hit
- **Identifier les bottlenecks** : Trouver les points faibles
- **Tester la stabilité** : Assurer 0% d'erreurs sous charge

---

## 📋 Prérequis

1. **Application démarrée** avec Redis actif
   ```bash
   docker-compose up -d redis
   cd backend && npm run start:dev
   ```

2. **Utilisateur de test créé**
   - Email: `loadtest@example.com`
   - Password: `Test123!LoadTest`

3. **Outil de test installé** (choisir un)

---

## 🚀 Option 1: Artillery (Recommandé pour débuter)

### Installation

```bash
npm install -g artillery
```

### Exécuter le Test

```bash
# Test complet avec rapport
artillery run artillery-load-test.yml

# Test avec rapport HTML
artillery run --output report.json artillery-load-test.yml
artillery report report.json --output report.html

# Ouvrir le rapport
start report.html  # Windows
open report.html   # macOS
xdg-open report.html  # Linux
```

### Scénarios du Test Artillery

Le test simule 3 types d'utilisateurs :

1. **Flux Authentifié (70%)** : Login + lecture de données
2. **Refresh Token (20%)** : Test du cache de session
3. **Lecture Seule (10%)** : Test intensif du cache

### Phases du Test (Total: 12 minutes)

1. **Warmup (1 min)** : 10 req/s - Réchauffement du cache
2. **Ramp up (2 min)** : 10→100 req/s - Montée progressive
3. **Sustained (5 min)** : 100 req/s - 6000 req/min soutenu
4. **Peak (1 min)** : 167 req/s - 10k req/min
5. **Cool down (1 min)** : 10 req/s - Retour au calme

### Métriques Attendues

| Métrique | Cible | Critique |
|----------|-------|----------|
| Taux d'erreur | < 1% | < 5% |
| p95 latence | < 500ms | < 1s |
| p99 latence | < 1s | < 2s |

---

## 🚀 Option 2: k6 (Recommandé pour production)

### Installation

**Windows (Chocolatey)** :
```bash
choco install k6
```

**macOS (Homebrew)** :
```bash
brew install k6
```

**Linux (Debian/Ubuntu)** :
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Exécuter le Test

```bash
# Test complet
k6 run k6-load-test.js

# Test avec rapport JSON
k6 run --out json=results.json k6-load-test.js

# Test avec InfluxDB (monitoring avancé)
k6 run --out influxdb=http://localhost:8086/k6 k6-load-test.js
```

### Scénarios du Test k6

1. **authenticatedUserFlow (70%)** : Flux complet utilisateur
2. **refreshTokenFlow (20%)** : Test cache de session
3. **cacheTestFlow (10%)** : 10 lectures successives

### Métriques Personnalisées k6

- `errors` : Taux d'erreurs global
- `cache_hits` : Taux de succès du cache Redis
- `login_duration` : Temps de login
- `api_duration` : Temps des requêtes API

---

## 📊 Interpréter les Résultats

### Artillery

Exemple de résultat attendu :
```
Summary report @ 17:30:00(+0100)
  Scenarios launched:  12000
  Scenarios completed: 12000
  Requests completed:  60000
  Mean response/sec: 100
  Response time (msec):
    min: 15
    max: 450
    median: 45
    p95: 120
    p99: 280
  Scenario counts:
    Flux Utilisateur Authentifié: 8400 (70%)
    Refresh Token Flow: 2400 (20%)
    Read-Only Operations: 1200 (10%)
  Codes:
    200: 60000
```

**✅ Bon résultat** :
- p95 < 500ms
- p99 < 1s
- 0% d'erreurs (code 200 partout)

**❌ Problème** :
- p95 > 1s → Bottleneck quelque part
- Erreurs 500 → Bug serveur
- Erreurs 429 → Rate limiting trop strict

### k6

Exemple de résultat attendu :
```
     ✓ login succeeded
     ✓ has access token
     ✓ subscriptions fetched
     ✓ events fetched
     ✓ categories fetched

     checks.........................: 100.00% ✓ 60000      ✗ 0
     data_received..................: 45 MB   75 kB/s
     data_sent......................: 12 MB   20 kB/s
     http_req_duration..............: avg=85ms    min=15ms med=45ms max=980ms p(95)=250ms p(99)=450ms
     http_reqs......................: 60000   100/s
     errors.........................: 0.00%   ✓ 0
     cache_hits.....................: 85.00%  ✓ 51000     ✗ 9000
```

**Analyse** :
- ✅ **100% checks passed** : Aucune erreur
- ✅ **p95=250ms** : Excellente performance
- ✅ **cache_hits=85%** : Cache très efficace
- ✅ **100 req/s** : Objectif 6000 req/min atteint

---

## 🔍 Debugging des Problèmes

### Performance Dégradée

1. **Vérifier Redis**
   ```bash
   docker exec -it remindy-redis redis-cli -a dev_password
   INFO stats
   ```
   - Chercher `keyspace_hits` vs `keyspace_misses`
   - Ratio hit/miss devrait être > 4:1 (80%)

2. **Vérifier la base de données**
   - Ouvrir un moniteur PostgreSQL
   - Surveiller le nombre de connexions
   - Vérifier les requêtes lentes

3. **Vérifier les logs de l'application**
   ```bash
   # Filtrer les logs de cache
   tail -f backend/logs/app.log | grep "Cache"
   ```

### Erreurs 5xx

- Vérifier les logs backend
- Vérifier la mémoire disponible
- Vérifier les connexions DB

### Cache Hit Rate Faible (< 60%)

1. Vérifier que Redis fonctionne
2. Vérifier les TTL des clés
3. Augmenter la durée de cache dans `.env`

---

## 📈 Scénarios de Test Additionnels

### Test de Stress (Trouver la limite)

```bash
# Artillery: Augmenter progressivement jusqu'à la rupture
artillery quick --count 1000 --num 10 http://localhost:8080/subscriptions
```

### Test de Spike (Pic soudain)

Créez `spike-test.yml` :
```yaml
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 10      # Spike soudain !
      arrivalRate: 500
    - duration: 60
      arrivalRate: 10
```

### Test de Soak (Endurance)

```bash
# k6: Test de 2 heures à charge constante
k6 run --duration 2h --vus 50 k6-load-test.js
```

---

## 🎯 Benchmarks Cibles

### Performance sans Cache (Baseline)

| Métrique | Valeur |
|----------|--------|
| p95 latence | ~200-500ms |
| Throughput max | ~500 req/min |
| Cache hit rate | 0% |

### Performance avec Cache Redis (Objectif)

| Métrique | Valeur | Amélioration |
|----------|--------|--------------|
| p95 latence | ~50-150ms | **3-10x** |
| Throughput max | ~10k req/min | **20x** |
| Cache hit rate | 80-90% | ∞ |

---

## 🚀 Production Load Testing

### Avant de tester en production

1. ⚠️ **AVERTIR L'ÉQUIPE**
2. ⚠️ **Vérifier les quotas cloud** (Neon, Upstash)
3. ⚠️ **Monitorer activement** (Datadog, New Relic)
4. ⚠️ **Avoir un plan de rollback**

### Test progressif en production

```bash
# Phase 1: Test léger (1k req/min)
artillery quick --count 100 --num 10 https://api.remindy.app/health

# Phase 2: Test modéré (5k req/min)
artillery run --target https://api.remindy.app production-test-moderate.yml

# Phase 3: Test complet (10k req/min)
artillery run --target https://api.remindy.app production-test-full.yml
```

---

## 📚 Ressources

- **Artillery** : https://artillery.io/docs/
- **k6** : https://k6.io/docs/
- **Redis Performance** : https://redis.io/docs/management/optimization/

---

## ✅ Checklist de Test

Avant de valider les performances :

- [ ] Redis démarré et connecté
- [ ] Application démarrée en mode production
- [ ] Utilisateur de test créé
- [ ] Test Artillery exécuté avec succès
- [ ] Test k6 exécuté avec succès
- [ ] p95 < 500ms
- [ ] p99 < 1s
- [ ] Taux d'erreur < 1%
- [ ] Cache hit rate > 80%
- [ ] 10k req/min soutenus sans erreur
- [ ] Logs analysés (pas d'erreurs cachées)
- [ ] Métriques sauvegardées pour comparaison future
