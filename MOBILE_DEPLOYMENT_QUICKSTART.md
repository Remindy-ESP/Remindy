# 🚀 Quick Start - Déploiement Mobile avec EAS

Guide rapide pour déployer Remindy sur iOS et Android en 30 minutes.

---

## ⚡ Setup Rapide (5 minutes)

### 1. Installer EAS CLI

```bash
# Installer globalement
npm install -g eas-cli

# Se connecter
eas login
```

### 2. Vérifier la Configuration

```bash
cd frontend_mobile

# Vérifier que tout est ok
cat eas.json      # ✅ Créé
cat app.json      # ✅ Mis à jour
```

**Configuration déjà prête** :
- ✅ `eas.json` configuré avec 3 profils (dev, preview, prod)
- ✅ `app.json` mis à jour avec bundleIdentifier et package
- ✅ Project ID EAS déjà lié
- ✅ `.easignore` créé

---

## 📱 Premier Build Android (15 minutes)

### Build de Test (APK)

```bash
cd frontend_mobile

# Build APK pour tester
eas build --platform android --profile preview
```

**Pendant le build, répondez** :
- `Generate a new keystore?` → **Yes**
- `Select a build profile` → **preview** (déjà sélectionné)

**Durée** : ~10-15 minutes

### Télécharger et Tester

```bash
# Option 1 : Dashboard
# → https://expo.dev/accounts/remindy/projects/remindy/builds
# → Cliquer "Download"

# Option 2 : CLI
eas build:list
eas build:download [BUILD_ID]

# Installer sur votre téléphone Android
adb install remindy-preview.apk
```

---

## 🍎 Premier Build iOS (15 minutes)

**Prérequis** :
- [ ] Compte Apple Developer ($99/an)
- [ ] App créée dans App Store Connect

### Build de Test

```bash
cd frontend_mobile

# Build pour iOS
eas build --platform ios --profile preview
```

**EAS va demander** :
1. **Apple ID** : votre-email@apple.com
2. **Password** : votre mot de passe Apple
3. **App-specific password** : Créez sur https://appleid.apple.com
   - Sign In → Security → App-Specific Passwords → Generate

**Durée** : ~15-20 minutes

### Installer via TestFlight

```bash
# Après le build, aller sur
https://expo.dev/accounts/remindy/projects/remindy/builds

# Télécharger l'IPA
# Uploader manuellement sur App Store Connect
# OU utiliser EAS submit (voir ci-dessous)
```

---

## 🏪 Soumission aux Stores

### Android → Google Play (Preview)

```bash
# 1. Créer Service Account (une seule fois)
# → https://console.cloud.google.com
# → IAM & Admin → Service Accounts → Create
# → Download JSON key

# 2. Placer le fichier
mkdir -p frontend_mobile/secrets
mv ~/Downloads/service-account.json frontend_mobile/secrets/google-play-service-account.json

# 3. Soumettre
eas submit --platform android --latest --profile preview
```

**Track** : `internal` (jusqu'à 100 testeurs)

### iOS → App Store Connect

```bash
# Soumettre directement
eas submit --platform ios --latest --profile production
```

**Après** : Allez sur App Store Connect pour soumettre pour review.

---

## 🔄 Workflow Recommandé

### 1. Développement Local

```bash
# Tester en local
npm start
```

### 2. Build Preview (Testeurs)

```bash
# Android + iOS
eas build --platform all --profile preview

# Partager avec testeurs via lien EAS
```

### 3. Build Production (Stores)

```bash
# Version finale pour les stores
eas build --platform all --profile production

# Soumettre
eas submit --platform all --latest
```

---

## 💡 Commandes Utiles

### Lister les Builds

```bash
# Voir tous les builds
eas build:list

# Filtrer par plateforme
eas build:list --platform android

# Filtrer par profil
eas build:list --profile production
```

### Annuler un Build

```bash
# Si vous vous êtes trompé
eas build:cancel [BUILD_ID]
```

### Voir les Credentials

```bash
# Android keystore
eas credentials -p android

# iOS certificates
eas credentials -p ios
```

### Re-build

```bash
# Re-builder avec cache vidé
eas build --platform android --profile production --clear-cache
```

---

## 📦 Scripts NPM Ajoutés

Ajoutez à `frontend_mobile/package.json` :

```json
{
  "scripts": {
    "build:android:preview": "eas build --platform android --profile preview",
    "build:android:prod": "eas build --platform android --profile production",
    "build:ios:preview": "eas build --platform ios --profile preview",
    "build:ios:prod": "eas build --platform ios --profile production",
    "build:all:prod": "eas build --platform all --profile production",
    "submit:android": "eas submit --platform android --latest",
    "submit:ios": "eas submit --platform ios --latest",
    "submit:all": "eas submit --platform all --latest"
  }
}
```

**Usage** :
```bash
npm run build:android:preview
npm run build:all:prod
npm run submit:all
```

---

## 🎯 Timeline Réaliste

| Étape | Durée |
|-------|-------|
| **Setup EAS CLI** | 5 min |
| **Premier build Android** | 15 min |
| **Tester APK** | 10 min |
| **Premier build iOS** | 20 min |
| **Setup Play Console** | 1h |
| **Setup App Store Connect** | 2h |
| **Première soumission** | 30 min |
| **Review Android** | 1-3 jours |
| **Review iOS** | 1-2 jours |
| **TOTAL première fois** | **~1 semaine** |

**Builds suivants** : ~15 min build + 15 min submit = **30 min total**

---

## 🐛 Problèmes Courants

### Build échoue : "Metro bundler error"

```bash
# Vider le cache
cd frontend_mobile
npm start -- --reset-cache
rm -rf node_modules
npm install
eas build --clear-cache
```

### "Keystore not found"

```bash
# Générer nouveau keystore
eas credentials -p android
# → Remove Keystore
# → Re-build (EAS va en générer un nouveau)
```

### "Apple authentication failed"

```bash
# Utiliser app-specific password
# https://appleid.apple.com → Security → App-Specific Passwords
```

### Build en attente depuis longtemps

```bash
# Vérifier les workers EAS
https://status.expo.dev

# Si gratuit : 1 build à la fois
# → Attendez la fin du build précédent
# → OU passez à EAS Paid ($29/mois)
```

---

## 💰 Coûts

| Service | Prix | Quand ? |
|---------|------|---------|
| **EAS Free** | Gratuit | 1 build/mois, lent |
| **EAS Paid** | $29/mois | Builds illimités, rapides |
| **Google Play** | $25 | Une seule fois |
| **Apple Developer** | $99/an | Chaque année |

**Recommandation** :
- Commencer avec EAS Free pour tester
- Passer à EAS Paid pour prod (builds plus rapides)

---

## ✅ Checklist Avant Production

### Technique

- [ ] App fonctionne sans crash
- [ ] Toutes les features testées
- [ ] Performance OK (pas de lags)
- [ ] Pas de logs de debug en production
- [ ] API backend en production
- [ ] Sentry/Analytics configuré

### Assets

- [ ] Icon 1024x1024 PNG
- [ ] Splash screen optimisé
- [ ] Screenshots (min 2 par plateforme)
- [ ] Feature graphic Android (1024x500)

### Légal

- [ ] Privacy Policy publiée (obligatoire)
- [ ] Terms of Service
- [ ] Content rating obtenu
- [ ] RGPD compliant (si Europe)

### Store Listing

- [ ] Nom de l'app (< 30 caractères)
- [ ] Description courte (< 80 caractères)
- [ ] Description complète
- [ ] Mots-clés (iOS)
- [ ] Catégorie appropriée
- [ ] URL support
- [ ] URL marketing (optionnel)

---

## 🚀 Commencer Maintenant

### Étape 1 : Build Android Preview (5 min)

```bash
cd frontend_mobile
eas build --platform android --profile preview
```

### Étape 2 : Pendant que ça build (15 min)

1. Créer compte Google Play Console
2. Créer l'app dans Play Console
3. Remplir Store Listing

### Étape 3 : Test (10 min)

1. Télécharger l'APK
2. Installer sur téléphone
3. Tester toutes les features

### Étape 4 : Production (2h)

1. Build production : `eas build --platform all --profile production`
2. Submit : `eas submit --platform all --latest`
3. Attendre review (1-3 jours)

---

## 📚 Ressources

- **Guide Complet** : `MOBILE_DEPLOYMENT_GUIDE.md`
- **EAS Docs** : https://docs.expo.dev/eas/
- **Status EAS** : https://status.expo.dev
- **Dashboard** : https://expo.dev/accounts/remindy/projects/remindy

---

## 🎉 Prochain

Après votre premier build réussi :

1. **Configurer OTA Updates** pour pusher des corrections sans rebuild
2. **Setup CI/CD** avec GitHub Actions
3. **Monitoring** avec Sentry
4. **Analytics** avec Firebase ou Amplitude

**Bonne chance ! 🚀**
