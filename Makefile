.PHONY: setup install dev-backend dev-mobile dev-admin migrate migrate-revert test-backend test-mobile help

# Détecte l'IP locale et écrit frontend_mobile/.env (Linux / macOS / Windows avec Node)
setup:
	node scripts/setup-env.js

# Installe les dépendances des trois sous-projets
install:
	npm install --prefix backend
	npm install --prefix frontend_mobile
	npm install --prefix frontend_admin

# Lance le backend en mode développement
dev-backend:
	npm --prefix backend run start:dev

# Lance le serveur Expo avec tunnel (mobile)
dev-mobile:
	npm --prefix frontend_mobile run start:tunnel

# Lance le serveur admin (Vite)
dev-admin:
	npm --prefix frontend_admin run dev

# Migrations base de données
migrate:
	npm --prefix backend run migration:run

migrate-revert:
	npm --prefix backend run migration:revert

# Tests
test-backend:
	npm --prefix backend run test

test-mobile:
	npm --prefix frontend_mobile run test

# Aide
help:
	@echo ""
	@echo "  make setup           Détecte l'IP locale et génère frontend_mobile/.env"
	@echo "  make install         Installe les dépendances (backend + mobile + admin)"
	@echo "  make dev-backend     Lance le backend NestJS (watch)"
	@echo "  make dev-mobile      Lance Expo avec tunnel (mobile)"
	@echo "  make dev-admin       Lance Vite (admin)"
	@echo "  make migrate         Applique les migrations TypeORM"
	@echo "  make migrate-revert  Annule la dernière migration"
	@echo "  make test-backend    Tests Jest backend"
	@echo "  make test-mobile     Tests Jest mobile"
	@echo ""
	@echo "  Équivalents npm (Windows sans make) :"
	@echo "    npm run setup        npm run dev:backend   npm run dev:mobile"
	@echo "    npm run dev:admin    npm run migrate        npm run test:backend"
	@echo ""
