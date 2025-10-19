# 🚀 Stratégie CI/CD - Remindy

## 📋 Vue d'ensemble

Ce projet utilise une stratégie CI/CD à 3 niveaux optimisée pour la performance et la sécurité.

```
feature/* ──PR──> develop ──PR──> preprod ──PR──> master
              │               │               │
              ├─ CI Rapide    ├─ CI Complète  └─ CD Production
              │  (~3-5 min)   │  (~10-15 min)    (~2-3 min)
              │               │
              └─ Lint + Build └─ Tests + E2E + Migrations
```

---

## 🎯 Pipelines

### 1️⃣ **CI - PR vers Develop** (`ci-pr-develop.yml`)

**Déclencheur :** Pull Request vers `develop`

**Durée estimée :** ~3-5 minutes

**Objectif :** Validation rapide du code avant merge

**Actions :**
- ✅ Lint (Backend, Frontend Admin, Mobile)
- ✅ Build check (Backend, Frontend Admin)
- ✅ TypeScript check (Mobile)
- ❌ **Pas de tests** (pour la rapidité)

**Quand ça échoue :**
- Erreurs de lint
- Erreurs de compilation TypeScript
- Erreurs de build

---

### 2️⃣ **CI - Develop vers Preprod** (`ci-develop-to-preprod.yml`)

**Déclencheur :**
- Pull Request vers `preprod`
- Push sur `develop` (optionnel)

**Durée estimée :** ~10-15 minutes

**Objectif :** Validation complète avant déploiement en preprod

**Actions :**
- ✅ Lint (tous les projets)
- ✅ Build (tous les projets)
- ✅ **Tests unitaires** (Backend) → PostgreSQL Docker (isolation)
- ✅ **Tests E2E** (Backend) → PostgreSQL Docker (isolation)
- ✅ **Coverage** (Backend)
- ✅ **Migrations DB** → Branche Neon "test" dédiée
- ✅ Tests frontend/mobile (si disponibles)

**Architecture hybride de tests :**
1. **Tests (unitaires/E2E)** : PostgreSQL Docker local
   - Chaque workflow a sa propre DB isolée
   - Pas de conflit entre PRs parallèles
   - Connexion : `postgresql://test_user:test_password@localhost:5432/test_db`

2. **Migrations** : Branche Neon "test"
   - Teste sur la vraie infrastructure Neon
   - Une seule branche permanente, réutilisable
   - Connexion via API Neon

**Configuration requise :**
- `NEON_PROJECT_ID` (secret)
- `NEON_API_KEY` (secret)
- `NEON_TEST_BRANCH_ID` (secret) ← Branche "test" à créer sur Neon

**Quand ça échoue :**
- Tests unitaires échouent
- Tests E2E échouent
- Migrations DB échouent
- Build échoue

---

### 3️⃣ **CD - Preprod vers Master** (`cd-preprod-to-master.yml`)

**Déclencheur :**
- Pull Request vers `master`
- Push sur `preprod`

**Durée estimée :** ~2-3 minutes

**Objectif :** Build et déploiement en production

**Actions :**
- ✅ Build Backend (artifact)
- ✅ Build Frontend Admin (artifact)
- ✅ Build Mobile Web (optionnel)
- ✅ **Migrations DB** sur Neon production (auto sur push)
- ✅ Upload des artifacts (rétention 30 jours)
- ❌ **Pas de tests** (déjà validés en preprod)

**Configuration requise :**
- `NEON_PROJECT_ID` (secret)
- `NEON_API_KEY` (secret)
- `NEON_PRODUCTION_BRANCH_ID` (secret)

**Artifacts générés :**
- `backend-build-{sha}` (fichiers compilés)
- `backend-package-{sha}` (package.json pour déploiement)
- `frontend-admin-build-{sha}` (fichiers statiques)

---

## 🔧 Configuration des Secrets GitHub

Allez dans **Settings > Secrets and variables > Actions** et ajoutez :

| Secret | Description | Utilisation |
|--------|-------------|-------------|
| `NEON_PROJECT_ID` | ID du projet Neon | Toutes les pipelines |
| `NEON_API_KEY` | Clé API Neon | Toutes les pipelines |
| `NEON_TEST_BRANCH_ID` | ID de la branche "test" | Tests de migrations CI/CD |
| `NEON_PRODUCTION_BRANCH_ID` | ID de la branche production | Migrations production |

### Comment obtenir ces valeurs ?

1. **NEON_PROJECT_ID** :
   - Allez sur [Neon Console](https://console.neon.tech/)
   - Copiez l'ID du projet depuis l'URL ou les settings

2. **NEON_API_KEY** :
   - Settings > API Keys > Create New API Key
   - Copiez et sauvegardez la clé

3. **Créer la branche "test" sur Neon** :
   ```bash
   curl -X POST \
     "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" \
     -H "Authorization: Bearer $NEON_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "branch": {
         "name": "test",
         "parent_id": "main"
       }
     }'
   ```
   - Récupérez le `branch_id` dans la réponse
   - Ajoutez-le comme secret `NEON_TEST_BRANCH_ID`

4. **NEON_PRODUCTION_BRANCH_ID** :
   - Utilisez votre branche principale Neon ou créez-en une dédiée pour la production
   - Copiez le branch ID depuis l'interface Neon

---

## 📊 Optimisations Appliquées

### ⚡ Performance

1. **Cache NPM** : Les dépendances sont cachées entre les runs
2. **Jobs parallèles** : Backend, Frontend et Mobile tournent en parallèle
3. **CI rapide pour les PRs** : Seulement lint + build (~3-5 min)
4. **Pas de tests redondants** : Les tests ne tournent qu'une fois (develop→preprod)

### 💰 Économie de CI/CD minutes

| Scénario | Avant | Après | Gain |
|----------|-------|-------|------|
| PR vers develop | ~15 min | ~3-5 min | **60-70%** |
| Develop → Preprod | ~15 min | ~10-15 min | Complet |
| Preprod → Master | ~15 min | ~2-3 min | **80%** |

### 🎯 Stratégie

- **PR develop** : Feedback rapide pour les développeurs
- **PR preprod** : Validation complète avant staging
- **PR master** : Build seulement, déploiement manuel

---

## 🔄 Workflow Recommandé

```bash
# 1. Créer une branche feature
git checkout -b feature/RMD-005

# 2. Développer et commit
git add .
git commit -m "feat: nouvelle fonctionnalité"

# 3. Push et créer PR vers develop
git push origin feature/RMD-005
# → CI rapide s'exécute (~3-5 min)

# 4. Merge dans develop
# → Optionnel : CI complète peut tourner

# 5. PR de develop vers preprod
# → CI complète s'exécute (~10-15 min)
# → Tests unitaires + E2E + Migrations

# 6. Merge dans preprod
# → Build automatique

# 7. PR de preprod vers master
# → CD s'exécute (~2-3 min)
# → Build artifacts + Migrations prod

# 8. Merge dans master
# → Télécharger artifacts et déployer manuellement
```

---

## 🐛 Dépannage

### ❌ "Database connection failed"

➡️ Vérifiez que les secrets Neon sont bien configurés

### ❌ "npm ci failed"

➡️ Vérifiez que `package-lock.json` est commit dans le repo

### ❌ "Migration failed"

➡️ Vérifiez que la branche Neon existe et est accessible

### ❌ "Tests failed"

➡️ Lancez les tests en local : `npm run test` et `npm run test:e2e`

---

## 📝 Notes

- L'ancienne pipeline est sauvegardée dans `ci-pipeline.yml.backup`
- Les artifacts de build sont conservés 30 jours
- Les coverage reports sont conservés 7 jours
- Le déploiement en production est **manuel** pour plus de contrôle

---

## 🚀 Prochaines étapes

1. ✅ Configurer les secrets GitHub
2. ✅ Créer les branches Neon (develop, production)
3. ✅ Tester avec une PR vers develop
4. ✅ Ajouter des tests unitaires/E2E si manquants
5. ⏳ Configurer le déploiement automatique (optionnel)

---

**Créé avec ❤️ pour Remindy**
