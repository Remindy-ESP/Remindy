# Connexion Backend ↔ APK Mobile

Guide rapide pour connecter votre API backend déployée avec votre application mobile Android.

---

## Étape 1 : Déployer le backend

### Option A : Railway (Recommandé - 10 min)

Suivez le guide : [`BACKEND_DEPLOYMENT_QUICKSTART.md`](BACKEND_DEPLOYMENT_QUICKSTART.md)

À la fin, vous aurez une URL du type :
```
https://remindy-api.up.railway.app
```

### Option B : Autre plateforme

Suivez le guide complet : [`BACKEND_DEPLOYMENT_GUIDE.md`](BACKEND_DEPLOYMENT_GUIDE.md)

---

## Étape 2 : Configurer l'app mobile

### 2.1 Créer/modifier `.env.production`

Dans le dossier `frontend_mobile/`, créez ou modifiez `.env.production` :

```env
# Production Backend URL
EXPO_PUBLIC_API_URL=https://remindy-api.up.railway.app

# Autres configurations
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_ENABLE_DEV_TOOLS=false
```

**Important** : Remplacez `https://remindy-api.up.railway.app` par l'URL de votre API déployée.

### 2.2 Mettre à jour `eas.json`

Dans `frontend_mobile/eas.json`, assurez-vous que le profil `production` utilise la bonne URL :

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://remindy-api.up.railway.app"
      }
    }
  }
}
```

---

## Étape 3 : Tester la connexion

### 3.1 Vérifier que l'API est accessible

Ouvrez votre navigateur et testez :
```
https://votre-api-url.com/api
```

Vous devriez voir la documentation Swagger.

### 3.2 Tester l'API avec curl

```bash
# Test simple
curl https://votre-api-url.com/api

# Test d'inscription (optionnel)
curl -X POST https://votre-api-url.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## Étape 4 : Vérifier les CORS

### 4.1 Vérifier la configuration CORS du backend

Dans `backend/src/main.ts`, vérifiez que les CORS sont bien configurés :

```typescript
const isProduction = process.env.NODE_ENV === 'production';
app.enableCors({
  origin: isProduction
    ? [
        process.env.FRONTEND_URL || 'https://yourdomain.com',
        'exp://*', // Pour Expo Go
        /^http:\/\/localhost:\d+$/, // Dev local
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // ...
});
```

### 4.2 Tester CORS depuis un navigateur

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
fetch('https://votre-api-url.com/api')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
```

Si vous voyez un résultat (HTML de Swagger), CORS fonctionne. Si erreur CORS, vérifiez la configuration.

---

## Étape 5 : Builder l'APK avec la bonne URL

### 5.1 Build avec EAS

```bash
cd frontend_mobile

# Build APK pour Android
eas build --platform android --profile production
```

EAS va :
1. Lire le profil `production` de `eas.json`
2. Utiliser les variables d'environnement définies
3. Créer un APK avec `EXPO_PUBLIC_API_URL` pointant vers votre backend

### 5.2 Suivre le build

Suivez l'URL fournie par EAS :
```
https://expo.dev/accounts/votre-compte/projects/remindy/builds/xxxxx
```

Le build prend environ **5-10 minutes**.

### 5.3 Télécharger l'APK

Une fois le build terminé, téléchargez l'APK :
- Depuis le lien fourni par EAS
- Ou depuis le dashboard EAS : https://expo.dev

---

## Étape 6 : Installer et tester l'APK

### 6.1 Installer l'APK sur Android

1. Transférez l'APK sur votre téléphone Android
2. Ouvrez l'APK (autorisez l'installation depuis des sources inconnues si demandé)
3. Installez l'application

### 6.2 Tester les fonctionnalités

1. **Inscription** : Créez un nouveau compte
   - Vérifiez que la requête arrive au backend
   - Vérifiez que l'email est bien envoyé (SendGrid)

2. **Connexion** : Connectez-vous avec le compte créé
   - Vérifiez que le token JWT est bien reçu

3. **Upload de document** : Uploadez un document
   - Vérifiez que le fichier est bien uploadé sur Cloudflare R2
   - Vérifiez que l'OCR (Gemini) fonctionne

4. **Création de rappel** : Créez un rappel
   - Vérifiez que le rappel est bien créé dans la base de données

### 6.3 Vérifier les logs du backend

```bash
# Railway
railway logs --follow

# Fly.io
fly logs

# Render
# Via le dashboard
```

Vérifiez que les requêtes de l'app mobile arrivent bien au backend.

---

## Troubleshooting

### ❌ L'app ne se connecte pas au backend

**Causes possibles** :
1. URL incorrecte dans `.env.production`
2. Backend non démarré ou crashé
3. CORS mal configuré
4. APK buildé avec la mauvaise URL

**Solutions** :

1. **Vérifiez l'URL** :
   ```bash
   # Dans l'APK, ouvrez les Settings ou About
   # Vérifiez que l'API URL est correcte
   ```

2. **Testez l'URL depuis un navigateur** :
   ```
   https://votre-api-url.com/api
   ```

3. **Vérifiez les logs du backend** :
   ```bash
   railway logs
   ```

4. **Rebuilder l'APK avec la bonne URL** :
   ```bash
   # Mettez à jour .env.production et eas.json
   eas build --platform android --profile production
   ```

### ❌ Erreur CORS

**Symptômes** :
- Requêtes bloquées dans l'app mobile
- Erreur dans les logs : "CORS policy"

**Solution** :

1. Vérifiez la configuration CORS dans `backend/src/main.ts`
2. Ajoutez `'exp://*'` dans les origins autorisées
3. Redéployez le backend

### ❌ Erreur 502 Bad Gateway

**Causes** :
- Backend crashé
- Migrations non exécutées
- Variables d'environnement manquantes

**Solution** :

1. **Vérifiez les logs** :
   ```bash
   railway logs
   ```

2. **Vérifiez les variables d'environnement** :
   ```bash
   cd backend
   npm run check:deployment
   ```

3. **Exécutez les migrations** :
   ```bash
   railway run npm run migration:run
   ```

### ❌ L'upload de fichiers échoue

**Causes** :
- Credentials Cloudflare R2 incorrects
- Bucket n'existe pas
- CORS R2 mal configuré

**Solution** :

1. Vérifiez les credentials R2 dans les variables d'environnement :
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

2. Vérifiez que le bucket existe sur Cloudflare

3. Configurez CORS sur le bucket R2 :
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"]
     }
   ]
   ```

### ❌ L'OCR ne fonctionne pas

**Causes** :
- Clé Gemini API invalide
- Quota Gemini dépassé

**Solution** :

1. Vérifiez la clé API Gemini : `GEMINI_API_KEY`
2. Vérifiez le quota sur [Google AI Studio](https://ai.google.dev/)
3. Redéployez le backend si la clé a changé

### ❌ Les emails ne sont pas envoyés

**Causes** :
- Clé SendGrid invalide
- Email d'envoi non vérifié
- Quota SendGrid dépassé

**Solution** :

1. Vérifiez la clé API : `SENDGRID_API_KEY`
2. Vérifiez que l'email `MAIL_FROM` est vérifié sur SendGrid
3. Vérifiez le quota SendGrid (100 emails/jour en tier gratuit)

---

## Flux de connexion complet

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. DÉPLOYER LE BACKEND                                     │
│     └─> Railway/Render/Fly.io/etc.                         │
│     └─> URL: https://remindy-api.up.railway.app           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  2. CONFIGURER L'APP MOBILE                                 │
│     └─> .env.production                                     │
│     └─> eas.json                                            │
│     └─> EXPO_PUBLIC_API_URL = backend URL                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  3. VÉRIFIER CORS                                           │
│     └─> backend/src/main.ts                                 │
│     └─> Autoriser 'exp://*'                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  4. BUILD APK                                               │
│     └─> eas build --platform android --profile production  │
│     └─> Télécharger l'APK                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  5. INSTALLER ET TESTER                                     │
│     └─> Installer l'APK sur Android                        │
│     └─> Tester inscription/connexion/upload/rappels        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  6. VÉRIFIER LES LOGS                                       │
│     └─> railway logs / fly logs / render logs             │
│     └─> Vérifier que les requêtes arrivent                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist de connexion

- [ ] Backend déployé et accessible
- [ ] URL du backend récupérée
- [ ] `.env.production` mis à jour avec l'URL
- [ ] `eas.json` mis à jour avec l'URL
- [ ] CORS configuré dans `backend/src/main.ts`
- [ ] API testée avec curl/navigateur
- [ ] APK buildé avec EAS
- [ ] APK téléchargé
- [ ] APK installé sur Android
- [ ] Test inscription fonctionnel
- [ ] Test connexion fonctionnel
- [ ] Test upload fonctionnel
- [ ] Test OCR fonctionnel
- [ ] Test rappels fonctionnel
- [ ] Logs du backend surveillés

---

## Prochaines étapes

Une fois la connexion établie :

1. **Distribuez l'APK** :
   - Via Google Play Store (Guide : `MOBILE_DEPLOYMENT_GUIDE.md`)
   - Ou en téléchargement direct

2. **Surveillez les performances** :
   - Logs Railway/Render/Fly.io
   - Métriques (CPU, RAM, requêtes)

3. **Configurez les sauvegardes** :
   - Base de données Neon (automatique)
   - Cloudflare R2 (versioning)

4. **Activez 2FA** :
   - Sur Railway/Render/Fly.io
   - Sur Neon, Upstash, Cloudflare
   - Sur SendGrid, Google Cloud

5. **Documentez** :
   - URL de production
   - Credentials (dans un gestionnaire de secrets)
   - Procédures de déploiement

---

**Connexion établie ?** Vous avez maintenant une stack complète en production !

Backend ✅ ↔ APK Mobile ✅
