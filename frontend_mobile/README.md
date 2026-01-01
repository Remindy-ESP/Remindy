# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Environment Configuration

### Fichiers d'environnement

- `.env` - Valeurs par défaut (commité dans git)
- `.env.local` - **Environnement local** (ignoré par git) - utilisez ce fichier pour votre configuration personnelle
- `.env.development` - Configuration development (commité dans git)
- `.env.staging` - Configuration staging (commité dans git)
- `.env.production` - Configuration production (commité dans git)

### Ordre de priorité

Expo charge les variables dans cet ordre (la dernière écrase les précédentes):
1. `.env`
2. `.env.development` (en mode development automatiquement)
3. `.env.local` (toujours chargé en dernier, écrase tout le reste)

### Utilisation

#### Développement local (par défaut)
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

### Configuration locale

Pour votre développement local:
1. Modifiez `.env.local` avec votre IP locale
2. Trouvez votre IP locale:
   - Windows: `ipconfig` (cherchez "Adresse IPv4")
   - Mac/Linux: `ifconfig` ou `ip addr`
3. Mettez à jour `EXPO_PUBLIC_BACKEND_API_URL` dans `.env.local`

### Variables disponibles

- `EXPO_PUBLIC_BACKEND_API_URL` - URL de l'API backend
- `EXPO_PUBLIC_BACKEND_API_TIMEOUT` - Timeout des requêtes API (ms)
- `EXPO_PUBLIC_ENV` - Nom de l'environnement (local/staging/production)

**Note:** `.env.local` n'est jamais commité dans git. Chaque développeur peut avoir sa propre configuration.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
