# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Remindy** is a reminder/document management application with three sub-projects in a monorepo:
- `backend/` — NestJS API (TypeScript, PostgreSQL/TypeORM)
- `frontend_mobile/` — React Native + Expo mobile app
- `frontend_admin/` — React + Vite admin dashboard

Each sub-project has its own `package.json` and must be run independently from its directory.

---

## Setup rapide (racine du projet)

```bash
make setup       # Détecte l'IP locale et génère frontend_mobile/.env
make dev-backend # Lance NestJS en watch mode
make dev-mobile  # Lance Expo
make dev-admin   # Lance Vite (admin)
make migrate     # Applique les migrations TypeORM

# Windows uniquement (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1
```

---

## Commands

### Backend (`cd backend`)

```bash
npm run start:dev          # Dev server (watch mode)
npm run build              # Compile TypeScript
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
npm run test               # Unit tests (Jest)
npm run test:watch         # Jest watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # End-to-end tests
npm run test -- --testPathPattern=<file>  # Run a single test file

# Database migrations
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
npm run migration:show
```

### Frontend Mobile (`cd frontend_mobile`)

```bash
npm start                  # Expo dev server (default env)
npm run start:staging      # Staging environment
npm run start:prod         # Production environment
npm run android            # Run on Android emulator/device
npm run ios                # Run on iOS simulator/device
npm run lint               # ESLint
npm run test               # Jest
npm run test:watch         # Jest watch mode
npm run test:coverage      # Coverage
```

### Frontend Admin (`cd frontend_admin`)

```bash
npm run dev                # Vite dev server
npm run build              # Production build
npm run lint               # ESLint
```

---

## Architecture

### Backend — Clean Architecture (4 layers)

Each NestJS module follows a strict 4-layer architecture with explicit mapper classes between layers:

```
Controller (Presentation)  ←→  PresenterDTO
    ↓ via UseCase
Application Layer          ←→  ApplicationDTO
    ↓ via Domain Service
Domain Layer               ←→  Domain Entities (pure business logic)
    ↓ via Repository interface
Infrastructure Layer       ←→  TypeORM Entities + Repositories
```

**17 modules** in `backend/src/modules/`: `auth`, `user`, `subscription`, `roles`, `audit`, `event`, `event-series`, `reminder`, `category`, `folder`, `document`, `storage`, `notification`, `admin`, `support`, `scheduler`, `seed`.

Key patterns:
- Each module has `application/` (contains `use-cases/`, `dto/`), `domain/` (entities, repositories interfaces, services interfaces, value-objects), `infrastructure/` (TypeORM entities, repository implementations, external services), and `presentation/` (controllers, DTOs, guards, decorators) sub-folders with explicit mapper classes at each boundary.
- Repositories use the TypeORM repository pattern injected via NestJS DI.
- Inter-module communication via NestJS EventEmitter (not direct imports where possible).
- `admin` module endpoints are CSRF-protected.
- Swagger API docs available at `http://localhost:3000/swagger/v1` when backend is running.

### Frontend Mobile — Feature-based structure

```
app/          # Expo Router pages (file-based routing)
features/     # Feature modules (each contains components, hooks, services)
components/   # Shared UI components
services/     # Axios-based API service layer
context/      # React Context (auth state, global state)
hooks/        # Custom hooks
utils/        # Helpers
```

Navigation uses Expo Router with a bottom tabs layout and authentication flow separation.

### Frontend Admin

Early-stage React app: `src/App.tsx` + Vite config + Playwright E2E tests.

---

## Branch Strategy

```
feature/* → develop → preprod → master
```

- `develop` is the source of truth — all feature PRs target `develop`.
- `preprod` and `master` are updated from `develop`/`preprod` using merge with `-X ours` strategy (develop always wins on conflict).
- **Never merge in reverse** (no preprod → develop, no master → develop).
- Tag production releases on `master`: `git tag -a v1.0.0 -m "Release 1.0.0"`.

To release to staging: `git merge develop -X ours -m "Release to staging"` from `preprod`.

Git aliases for the release flow (add once to `~/.gitconfig`):
```bash
git config --global alias.merge-to-preprod '!git checkout preprod && git pull origin preprod && git merge develop -X ours && git push origin preprod && git checkout develop'
git config --global alias.merge-to-master '!git checkout master && git pull origin master && git merge preprod -X ours && git push origin master && git checkout develop'
```

---

## CI/CD

Three GitHub Actions pipelines:
1. **PR to develop** — lint + build only (fast feedback, ~3-5 min)
2. **develop → preprod** — full: lint, build, unit tests, e2e, coverage, DB migrations against Neon test branch (~10-15 min)
3. **preprod → master** — build + artifacts + prod DB migrations on Neon (~2-3 min)

Required secrets: `NEON_PROJECT_ID`, `NEON_API_KEY`, `NEON_TEST_BRANCH_ID`, `NEON_PRODUCTION_BRANCH_ID`.

---

## Environment Configuration

Each sub-project has a `.env.exemple` file showing required variables. Key backend variables: Neon PostgreSQL URLs (dev/staging/prod/test), JWT secrets, Cloudflare R2 credentials (S3-compatible: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`), SMTP via Brevo (`SENDGRID_API_KEY`), and `GEMINI_API_KEY`. The backend env file for local dev is `.env.develop` (not `.env`).

Mobile env priority (lowest → highest): `.env` → `.env.development` → `.env.local`. Create `.env.local` with your machine's local IP for physical device development (`EXPO_PUBLIC_BACKEND_API_URL=http://192.168.x.x:3000`). The `make setup` command auto-detects and writes this.

---

## Database

- PostgreSQL via [Neon](https://neon.tech) (serverless). **No `synchronize: true`** — migrations only.
- Generate migrations after changing TypeORM entities: `npm run migration:generate -- -n DescriptiveName`.
- Always review generated migration SQL before running `migration:run`.