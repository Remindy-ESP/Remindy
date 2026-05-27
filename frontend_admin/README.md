# Remindy — Admin Dashboard

Back-office web de Remindy : interface d'administration pour **consulter les
statistiques**, **gérer les tickets de support des utilisateurs** et piloter le
reste de la plateforme. Construit en React + Vite, il consomme l'API NestJS du
dossier `backend/`.

## Fonctionnalités

L'accès se fait par connexion administrateur, avec **MFA (TOTP)** obligatoire.
Une fois authentifié, le dashboard expose les modules suivants :

| Module           | Rôle                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| **Dashboard**    | KPIs et graphiques (utilisateurs, abonnements, OCR…)                 |
| **Support**      | Liste et détail des tickets utilisateurs, réponses                   |
| **Users**        | Liste et fiche détaillée des utilisateurs                            |
| **Subscriptions**| Suivi des abonnements et indicateurs de facturation                  |
| **Cloud**        | Statistiques de traitement OCR des documents                         |
| **Security**     | Politiques de sécurité, IP bloquées, événements suspects             |
| **RBAC**         | Gestion des rôles et permissions                                     |
| **RGPD**         | Exports de données et anonymisation des comptes                      |
| **Audit**        | Journal d'audit (actions administrateur)                             |

Certains modules sont protégés par permission : un administrateur sans le droit
requis voit un écran d'accès refusé.

## Stack

- **React 19** + **TypeScript** + **Vite**
- **MUI 7** (+ MUI X DataGrid) pour l'UI
- **TanStack Query** pour les appels API et le cache
- **React Router 7** pour le routage
- **React Hook Form** + **Zod** pour les formulaires et la validation
- **Recharts** pour les graphiques, **Axios** pour le HTTP
- **Playwright** pour les tests E2E

## Démarrage

Prérequis : Node.js 22+ et le backend lancé sur `http://localhost:3000`
(voir le `README` racine / `make dev-backend`).

```bash
npm install        # installe les dépendances
npm run dev        # serveur de dev sur http://localhost:5174
```

En développement, les requêtes vers `/api` sont automatiquement proxifiées vers
le backend (`http://localhost:3000`), donc aucune configuration n'est nécessaire.

## Scripts

```bash
npm run dev        # serveur de dev (port 5174)
npm run build      # build de production (dossier dist/)
npm run preview    # prévisualise le build de production
npm run lint       # ESLint
npx playwright test  # tests E2E Playwright
```

## Variables d'environnement

| Variable       | Défaut | Description                                                        |
| -------------- | ------ | ------------------------------------------------------------------ |
| `VITE_API_URL` | `/api` | URL de base de l'API. En dev, laisser vide pour utiliser le proxy. |

## Structure

```
src/
├── modules/      # un dossier par domaine (dashboard, support, users, …)
│   └── <module>/
│       ├── ui/             # composants et pages React
│       ├── application/    # hooks, logique d'orchestration
│       └── infrastructure/ # clients API (Axios)
├── shared/       # composants, types et utilitaires partagés
└── config/       # configuration (API, thème)
```

Chaque module suit la **Clean Architecture** appliquée au front. Les détails,
conventions et exemples sont documentés dans
[`CLEAN_ARCHITECTURE.md`](./CLEAN_ARCHITECTURE.md).

## Déploiement

L'application est buildée en statique puis servie par **nginx** dans un conteneur
Docker (`Dockerfile` + `nginx.conf`).
