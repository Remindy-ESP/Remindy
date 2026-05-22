# i18n

This folder owns the language stack for the Remindy mobile app: language
detection, persistence, namespaces, formatters and the type augmentation
that makes mistyped translation keys a TypeScript error.

## Architecture in one paragraph

`config.ts` declares the supported language codes (`en`, `fr`),
namespaces (`common`, `auth`, `subscriptions`, `statistics`, `settings`,
`errors`) and the AsyncStorage key. `detectLanguage.ts` resolves the
active language on app start by checking AsyncStorage first, then
`expo-localization`, then falling back to English. `index.ts`
initializes `i18next` + `react-i18next` from the bundled `resources.ts`
and is imported once at the top of `app/_layout.tsx`. `formatters.ts`
gives you locale-aware currency / date / number helpers (and matching
react hooks). `react-i18next.d.ts` augments the library types so the
EN resource shape becomes the canonical key map — calling
`t('common:does-not-exist')` won't compile.

The `LanguageSwitcher` UI lives at `components/settings/LanguageSwitcher.tsx`
and is mounted on `app/(tabs)/profile-preferences.tsx`. Selecting a
language calls `changeAppLanguage` which atomically updates i18next and
persists to AsyncStorage.

## Adding a new locale (worked example: Spanish, `es`)

This is a one-folder + one-line change.

### 1. Add the code to `SUPPORTED_LANGUAGES`

`i18n/config.ts`:

```ts
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es'] as const;

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
};
```

That's the only code change needed — the type system now expects an
`es` resource entry, and the `LanguageSwitcher` will render a third
option automatically.

### 2. Copy the `en/` folder to `es/`

```bash
cp -R i18n/locales/en i18n/locales/es
```

You now have:

```
i18n/locales/es/
  auth.json
  common.json
  errors.json
  settings.json
  statistics.json
  subscriptions.json
```

Translate each file in place. Keep the same key tree as `en/` — the
canonical resource shape is anchored on EN via `react-i18next.d.ts`,
so renaming a key without renaming it in EN first will fail to compile.

### 3. Wire the new locale into `resources.ts`

`i18n/resources.ts`:

```ts
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esSubscriptions from './locales/es/subscriptions.json';
import esStatistics from './locales/es/statistics.json';
import esSettings from './locales/es/settings.json';
import esErrors from './locales/es/errors.json';

export const resources = {
  en: { /* unchanged */ },
  fr: { /* unchanged */ },
  es: {
    common: esCommon,
    auth: esAuth,
    subscriptions: esSubscriptions,
    statistics: esStatistics,
    settings: esSettings,
    errors: esErrors,
  },
} as const;
```

### 4. (Optional) Map a BCP-47 locale for `Intl`

`i18n/formatters.ts` has a `LOCALE_TO_BCP47` table. Numbers and dates
in Spanish should use `es-ES` (or another regional variant):

```ts
const LOCALE_TO_BCP47: Record<SupportedLanguage, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};
```

If you skip this step the helpers still work — they just fall back to
`en-US` for number/date formatting.

### 5. Verify

```bash
npm run lint
npm test
npx tsc --noEmit
```

The type check will complain if any key from `en/` is missing in
`es/`. Tests should still pass — the existing test suite runs in
French via the mocked device locale; the new Spanish entries don't
affect that path.

## Adding a new namespace

Less common, but supported:

1. Add the name to `NAMESPACES` in `config.ts`.
2. Create `i18n/locales/{en,fr,…}/<namespace>.json` with `{}`.
3. Import + add it to every locale entry in `resources.ts`.

The augmentation in `react-i18next.d.ts` derives its key map from
`resources['en']`, so the new namespace becomes typeable as soon as
its EN file exists.

## What NOT to translate

- Console logs (`console.error`, `console.warn`, etc.).
- Dev-only error messages thrown for impossible states.
- Code comments.
- Brand names, currency codes, identifiers in strings used by `Intl`.
- Backend-supplied labels (e.g. `summary.periodLabel` from the
  statistics API). Server-side localization is a follow-up.

## File map

| File | Purpose |
|---|---|
| `config.ts` | Language codes, namespaces, labels, type guard |
| `detectLanguage.ts` | AsyncStorage → device locale → fallback chain |
| `languageStorage.ts` | Get/set/clear the persisted language |
| `index.ts` | i18next init + `changeAppLanguage` |
| `resources.ts` | Static JSON imports per locale |
| `react-i18next.d.ts` | Module augmentation for type-safe keys |
| `formatters.ts` | Locale-aware currency/date/number helpers + hooks |
| `locales/<lang>/<ns>.json` | The translations themselves |
