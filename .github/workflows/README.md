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

### 4️⃣ **Commit Lint** (`commit-lint.yml`)

**Déclencheur :** PR vers `develop`, `preprod`, `master`

Valide que **tous les commits** de la PR respectent le format Conventional Commits. **Bloquant** : une PR avec un seul commit non-conventionnel ne peut pas être mergée.

---

### 5️⃣ **Security - Trivy Scan** (`security-trivy-scan.yml`)

**Déclencheur :** PR vers `develop`, `preprod`, `master`

Scan de sécurité indépendant :
- Filesystem scan (backend, frontend_admin, frontend_mobile) — dépendances + secrets
- Config scan (Dockerfile, IaC)

Bloque la PR en cas de vuln **CRITICAL** ou **HIGH** avec fix disponible.

---

### 6️⃣ **Docker - Build & Push** (`docker-build-develop.yml`, `docker-build-preprod.yml`)

**Déclencheur :** push sur `develop` (après merge) / push sur `preprod` (après merge)

Build les images backend + admin en `linux/amd64`, push sur Docker Hub (`remindy/remindy-t-esp`), scan Trivy sur l'image poussée.

Tags publiés :
- develop → `backend-dev-<sha7>`, `admin-dev-<sha7>` (+ variante datée)
- preprod → `backend-preprod-<sha7>`, `admin-preprod-<sha7>` (+ variante datée)

---

### 7️⃣ **Docker - Release** (`docker-release-master.yml`)

**Déclencheur :** push sur `master` (après merge)

1. semantic-release analyse les commits conventionnels depuis le dernier tag.
2. Calcule la nouvelle version, crée le tag Git `vX.Y.Z`, génère `CHANGELOG.md` et la GitHub Release.
3. Build & push des images `backend-vX.Y.Z` + `admin-vX.Y.Z`.
4. Scan Trivy bloquant (CRITICAL/HIGH).

Aucune image n'est publiée si aucun commit ne justifie une release (`feat`, `fix`, `perf`, `refactor`, `revert`, `BREAKING CHANGE`).

---

## ✍️ Conventional Commits (obligatoire)

Le format est strict — sinon `commit-lint` bloque la PR et semantic-release ne fonctionne pas.

### Format

```
<type>(<scope optionnel>): <sujet en minuscules, sans point final>

[corps optionnel]

[BREAKING CHANGE: description]
```

### Types et impact sur la version

| Type | Version | Utilisation |
|---|---|---|
| `feat` | **minor** | Nouvelle fonctionnalité |
| `fix` | **patch** | Correction de bug |
| `perf` | patch | Amélioration perf |
| `refactor` | patch | Refactoring |
| `revert` | patch | Revert d'un commit |
| `docs` | aucun | Documentation |
| `style` | aucun | Formatage |
| `chore` | aucun | Maintenance |
| `test` | aucun | Tests |
| `build` | aucun | Build system |
| `ci` | aucun | CI/CD |
| `BREAKING CHANGE:` (footer) | **major** | Rupture d'API |

### Exemples

```
feat(auth): ajoute le support MFA via TOTP
fix(document): corrige le crash lors de l'upload PDF > 10Mo
refactor(user): simplifie le repository pattern
chore(deps): bump nestjs to 11.2.0

feat(api)!: retire l'endpoint /v1/legacy-auth

BREAKING CHANGE: l'endpoint /v1/legacy-auth est supprimé, utiliser /v2/auth
```

### Installation du hook local (1 fois)

```bash
# depuis la racine du monorepo
npm install
```

Husky active automatiquement le hook `commit-msg` qui valide chaque commit côté dev. Si un commit mal formaté passe quand même (ex : `--no-verify`), le workflow `commit-lint` le rattrape sur la PR.

---

## 🔧 Configuration des Secrets GitHub

Allez dans **Settings > Secrets and variables > Actions** et ajoutez :

| Secret | Description | Utilisation |
|--------|-------------|-------------|
| `DOCKERHUB_USERNAME` | Login Docker Hub (`remindy`) | docker-build-* + docker-release-master |
| `DOCKERHUB_TOKEN` | Access token Docker Hub (Read + Write + Delete) | docker-build-* + docker-release-master |
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

1. ✅ Configurer les secrets GitHub (Neon + `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN`)
2. ✅ Créer le repo Docker Hub privé `remindy/remindy-t-esp`
3. ✅ Créer les branches Neon (develop, production)
4. ✅ Installer le hook husky localement (`npm install` à la racine du monorepo)
5. ✅ Activer les branch protection rules (rendre `commit-lint` et `security-trivy-scan` bloquants)
6. ✅ Tester avec une PR vers develop
7. ✅ Ajouter des tests unitaires/E2E si manquants
8. ⏳ Configurer le déploiement automatique (optionnel)

---

**Créé avec ❤️ pour Remindy**
