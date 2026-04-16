.PHONY: setup dev-backend dev-mobile dev-admin help

# Détecte l'IP locale et écrit frontend_mobile/.env
setup:
	@bash scripts/setup-env.sh

# Lance le backend en mode développement
dev-backend:
	cd backend && npm run start:dev

# Lance le serveur Expo (mobile)
dev-mobile:
	cd frontend_mobile && npx expo start --tunnel

# Lance le serveur admin (Vite)
dev-admin:
	cd frontend_admin && npm run dev

# Migrations base de données
migrate:
	cd backend && npm run migration:run

migrate-revert:
	cd backend && npm run migration:revert

# Tests
test-backend:
	cd backend && npm run test

test-mobile:
	cd frontend_mobile && npm run test

# Aide
help:
	@echo ""
	@echo "  make setup          Détecte l'IP locale et génère frontend_mobile/.env"
	@echo "  make dev-backend    Lance le backend NestJS (watch)"
	@echo "  make dev-mobile     Lance Expo (mobile)"
	@echo "  make dev-admin      Lance Vite (admin)"
	@echo "  make migrate        Applique les migrations TypeORM"
	@echo "  make migrate-revert Annule la dernière migration"
	@echo "  make test-backend   Tests Jest backend"
	@echo "  make test-mobile    Tests Jest mobile"
	@echo ""
