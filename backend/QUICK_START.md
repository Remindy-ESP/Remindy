# Quick Start Guide - Remindy Backend

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
cd backend
npm install
```

### 2. Configuration de l'environnement
Créer un fichier `.env.staging` (ou `.env.develop` pour le développement) :
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database_name
NEON_DATABASE_URL_STAGING=postgresql://user:password@host:5432/database_name

# Server
BACKEND_PORT=3000
NODE_ENV=staging

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Lancer les migrations
```bash
# Voir les migrations disponibles
npm run migration:show

# Appliquer les migrations
npm run migration:run

# Revenir en arrière (si nécessaire)
npm run migration:revert
```

### 4. Démarrer le serveur

**Mode développement (avec hot reload):**
```bash
npm run start:dev
```

**Mode production:**
```bash
npm run build
npm run start:prod
```

### 5. Accéder à Swagger
Une fois le serveur démarré, accédez à :
```
http://localhost:3000/api/docs
```

## 📝 Commandes Disponibles

### Build & Start
```bash
# Build du projet
npm run build

# Démarrer en mode développement
npm run start:dev

# Démarrer avec debug
npm run start:debug

# Démarrer en production
npm run start:prod
```

### Migrations
```bash
# Générer une nouvelle migration (détecte les changements)
npm run migration:generate -- NomDeLaMigration

# Créer une migration vide
npm run migration:create -- NomDeLaMigration

# Appliquer les migrations
npm run migration:run

# Revenir en arrière d'une migration
npm run migration:revert

# Voir l'état des migrations
npm run migration:show
```

### Tests
```bash
# Lancer tous les tests
npm test

# Tests avec watch mode
npm run test:watch

# Tests avec coverage
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests en mode debug
npm run test:debug
```

### Lint & Format
```bash
# Linter le code
npm run lint

# Formatter le code
npm run format
```

## 🧪 Tester l'API

### Créer un utilisateur
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Obtenir la liste des utilisateurs
```bash
curl http://localhost:3000/users?page=1&limit=10
```

### Créer un rôle
```bash
curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Premium",
    "description": "Premium subscription role"
  }'
```

### Obtenir la liste des rôles
```bash
curl http://localhost:3000/roles
```

## 🔍 Vérifier que tout fonctionne

### 1. Build sans erreurs
```bash
npm run build
# ✅ Devrait compiler sans erreurs
```

### 2. Serveur démarre correctement
```bash
npm run start:dev
# ✅ Devrait afficher:
# Application is running on: http://localhost:3000
# Swagger documentation: http://localhost:3000/api/docs
```

### 3. Swagger est accessible
Ouvrir `http://localhost:3000/api/docs` dans le navigateur
- ✅ Devrait afficher l'interface Swagger UI
- ✅ Devrait voir les endpoints pour users, roles, user-sessions, user-preferences

### 4. Database est accessible
```bash
npm run migration:show
# ✅ Devrait afficher les migrations disponibles
```

## 📚 Structure du Projet

```
backend/
├── src/
│   ├── modules/                    # Modules de domaine
│   │   ├── user/
│   │   │   ├── domain/            # Logique métier
│   │   │   ├── infrastructure/    # Persistence
│   │   │   └── application/       # API, DTOs, Services
│   │   ├── role/
│   │   ├── role-limit/
│   │   ├── user-session/
│   │   └── user-preference/
│   ├── infrastructure/            # Configuration globale
│   │   ├── config/               # Configs DB, etc.
│   │   └── database/
│   │       └── migrations/       # Migrations TypeORM
│   ├── app.module.ts
│   └── main.ts                   # Point d'entrée
├── test/                         # Tests E2E
├── package.json
└── tsconfig.json
```

## 🛠️ Troubleshooting

### Erreur de connexion à la base de données
```
Error: connect ECONNREFUSED
```
**Solution:** Vérifier que :
- La base de données est accessible
- Les credentials dans `.env.staging` sont corrects
- Le serveur PostgreSQL est démarré

### Erreurs de TypeScript lors du build
```
error TS2339: Property 'xxx' does not exist
```
**Solution:**
```bash
# Nettoyer et rebuilder
rm -rf dist node_modules
npm install
npm run build
```

### Port déjà utilisé
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Trouver le processus
npx kill-port 3000

# Ou changer le port dans .env.staging
BACKEND_PORT=3001
```

### Migration échoue
```
Error: relation "users" already exists
```
**Solution:**
```bash
# Vérifier l'état
npm run migration:show

# Si besoin, revert et retry
npm run migration:revert
npm run migration:run
```

## 🔐 Sécurité (TODO)

⚠️ **Important:** Avant la mise en production, implémenter :

1. **Authentification JWT**
   - Middleware d'authentification
   - Guards pour protéger les routes
   - Refresh tokens

2. **Validation robuste**
   - Validation des entrées utilisateur
   - Sanitization des données
   - Rate limiting

3. **Variables d'environnement**
   - Ne jamais commit les `.env` files
   - Utiliser des secrets forts
   - Changer les credentials par défaut

4. **Headers de sécurité**
   - Helmet.js
   - CSRF protection
   - HTTPS obligatoire en production

## 📖 Documentation

- 📄 [État d'implémentation détaillé](./IMPLEMENTATION_STATUS.md)
- 📄 [Guide Docker](../DOCKER.md)
- 📄 [Guide de déploiement](../DEPLOYMENT.md)
- 🌐 [Swagger UI](http://localhost:3000/api/docs) (quand le serveur tourne)

## 💡 Tips

1. **Utiliser Swagger pour tester** : Plus rapide que cURL, interface graphique
2. **Watch mode pour dev** : `npm run start:dev` recharge automatiquement
3. **Logs dans la console** : TypeORM affiche les requêtes SQL (utile pour debug)
4. **VSCode** : Installer les extensions recommandées (ESLint, Prettier, etc.)

## ✅ Checklist avant commit

- [ ] `npm run build` passe sans erreurs
- [ ] `npm run lint` ne retourne pas d'erreurs
- [ ] Les migrations sont testées localement
- [ ] Les nouveaux endpoints sont documentés dans Swagger
- [ ] Les tests sont écrits (quand implémentés)
- [ ] Le fichier `IMPLEMENTATION_STATUS.md` est mis à jour
