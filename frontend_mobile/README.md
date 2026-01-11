# 📱 Remindy Mobile - React Native Expo

Application mobile iOS et Android pour Remindy - Gestion d'abonnements et rappels.

---

## 🚀 Démarrage Rapide

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur Expo
npm start

# Ou directement sur un émulateur
npm run android  # Android
npm run ios      # iOS (macOS uniquement)
```

### Vérifier la Configuration Build

```bash
# Vérifier que tout est prêt pour le build EAS
npm run check-build
```

---

## 🌍 Configuration des Environnements

### Fichiers d'Environnement

- `.env` - Valeurs par défaut (commité dans git)
- `.env.local` - **Environnement local** (ignoré par git) - utilisez ce fichier pour votre configuration personnelle
- `.env.development` - Configuration development (commité dans git)
- `.env.staging` - Configuration staging (commité dans git)
- `.env.production` - Configuration production (commité dans git)

### Ordre de Priorité

Expo charge les variables dans cet ordre (la dernière écrase les précédentes):
1. `.env`
2. `.env.development` (en mode development automatiquement)
3. `.env.local` (toujours chargé en dernier, écrase tout le reste)

### Utilisation

#### Développement Local (par défaut)
```bash
npm start          # Lance Expo
npm run android    # Lance sur Android
npm run ios        # Lance sur iOS
```
Utilise `.env.local` avec votre IP locale (ex: 192.168.1.38:3000)

#### Tester avec Staging
```bash
npm run start:staging
npm run android:staging
npm run ios:staging
```

#### Tester avec Production
```bash
npm run start:prod
npm run android:prod
npm run ios:prod
```

### Configuration Locale

Pour votre développement local:
1. Modifiez `.env.local` avec votre IP locale
2. Trouvez votre IP locale:
   - Windows: `ipconfig` (cherchez "Adresse IPv4")
   - Mac/Linux: `ifconfig` ou `ip addr`
3. Mettez à jour `EXPO_PUBLIC_BACKEND_API_URL` dans `.env.local`

### Variables Disponibles

- `EXPO_PUBLIC_BACKEND_API_URL` - URL de l'API backend
- `EXPO_PUBLIC_BACKEND_API_TIMEOUT` - Timeout des requêtes API (ms)
- `EXPO_PUBLIC_ENV` - Nom de l'environnement (local/staging/production)

**Note:** `.env.local` n'est jamais commité dans git. Chaque développeur peut avoir sa propre configuration.

---

## 📦 Build et Déploiement avec EAS

### Installation EAS CLI

```bash
# Installer globalement
npm install -g eas-cli

# Se connecter
eas login
```

### Builds de Développement

```bash
# Android Development (APK)
npm run build:android:dev

# iOS Development (Simulator)
npm run build:ios:dev
```

### Builds de Preview (Tests)

```bash
# Android Preview
npm run build:android:preview

# iOS Preview
npm run build:ios:preview

# Les deux
npm run build:all:preview
```

### Builds de Production

```bash
# Android Production (AAB pour Play Store)
npm run build:android:prod

# iOS Production (IPA pour App Store)
npm run build:ios:prod

# Les deux
npm run build:all:prod
```

---

## 🏪 Soumission aux Stores

### Google Play Store

```bash
# Soumettre le dernier build Android
npm run submit:android
```

### Apple App Store

```bash
# Soumettre le dernier build iOS
npm run submit:ios
```

### Les Deux Stores

```bash
# Soumettre aux deux stores
npm run submit:all
```

---

## 🔄 Over-The-Air Updates

### Publier une Update

```bash
# Update de production (JS/assets seulement)
npm run update:prod

# Update de preview
npm run update:preview

# Ou avec message personnalisé
eas update --branch production --message "Fix critical bug"
```

**Limitations OTA** :
- ✅ Code JavaScript/TypeScript
- ✅ Assets (images, fonts)
- ❌ Code natif (plugins, native modules)
- ❌ Configuration app.json

---

## 📁 Structure du Projet

```
frontend_mobile/
├── app/                      # Expo Router (pages)
│   ├── (tabs)/              # Navigation tabs
│   ├── +html.tsx            # HTML wrapper
│   ├── +not-found.tsx       # 404
│   └── _layout.tsx          # Root layout
├── assets/                   # Images, fonts, etc.
│   └── images/
│       ├── icon.png         # 1024x1024
│       ├── splash-icon.png  # Splash screen
│       └── adaptive-icon.png # Android
├── components/              # Composants réutilisables
├── constants/               # Constantes (colors, etc.)
├── hooks/                   # Custom hooks
├── scripts/                 # Scripts utilitaires
│   ├── check-build-readiness.js
│   └── load-env.js
├── .easignore              # Fichiers exclus du build
├── .env.example            # Template variables
├── app.json                # Configuration Expo
├── eas.json                # Configuration EAS
├── package.json            # Dépendances
└── tsconfig.json           # TypeScript config
```

---

## 📱 Scripts Disponibles

### Développement

| Script | Description |
|--------|-------------|
| `npm start` | Démarrer Expo |
| `npm run android` | Ouvrir sur Android |
| `npm run ios` | Ouvrir sur iOS |
| `npm run web` | Ouvrir dans navigateur |

### Build EAS

| Script | Description |
|--------|-------------|
| `npm run build:android:preview` | Build Android preview |
| `npm run build:ios:preview` | Build iOS preview |
| `npm run build:all:prod` | Build production (tous) |

### Submit

| Script | Description |
|--------|-------------|
| `npm run submit:android` | Soumettre Android |
| `npm run submit:ios` | Soumettre iOS |
| `npm run submit:all` | Soumettre aux deux stores |

### Updates

| Script | Description |
|--------|-------------|
| `npm run update:prod` | OTA update production |
| `npm run update:preview` | OTA update preview |

### Utilitaires

| Script | Description |
|--------|-------------|
| `npm run check-build` | Vérifier config build |
| `npm run lint` | Linter le code |
| `npm run test` | Lancer les tests |

---

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📚 Documentation Complète

Pour plus d'informations sur le déploiement :

- **Quick Start** : `/MOBILE_DEPLOYMENT_QUICKSTART.md` - Déployer en 30 minutes
- **Guide Complet** : `/MOBILE_DEPLOYMENT_GUIDE.md` - Guide détaillé (2000 lignes)
- **Résumé** : `/MOBILE_DEPLOYMENT_SUMMARY.md` - Vue d'ensemble

---

## 🔗 Liens Utiles

- **Dashboard EAS** : https://expo.dev/accounts/remindy/projects/remindy
- **Expo Docs** : https://docs.expo.dev
- **EAS Build** : https://docs.expo.dev/build/introduction/
- **EAS Submit** : https://docs.expo.dev/submit/introduction/
- **Expo Router** : https://docs.expo.dev/router/introduction/

---

## 🐛 Troubleshooting

### Build échoue

```bash
# Vider le cache et re-builder
eas build --clear-cache
```

### Metro bundler error

```bash
# Reset cache
npm start -- --reset-cache

# Réinstaller
rm -rf node_modules
npm install
```

### Credentials error

```bash
# Voir/gérer credentials
eas credentials -p android
eas credentials -p ios
```

---

## 📞 Support

- **Documentation** : Voir guides dans `/docs`
- **Expo Forums** : https://forums.expo.dev
- **GitHub Issues** : Pour les bugs

---

## 📝 License

Copyright © 2026 Remindy. Tous droits réservés.
