# -----------------------------
# Configuration
# -----------------------------
DEV_COMPOSE = docker-compose.dev.yml
PROD_COMPOSE = docker-compose.yml
API_SERVICE = api

# -----------------------------
# Help
# -----------------------------
.PHONY: help
help:
	@echo ""
	@echo "Available commands:"
	@echo "  make dev        Start dev stack (hot reload, no build)"
	@echo "  make dev-build  Rebuild dev image"
	@echo "  make dev-down   Stop dev stack"
	@echo "  make logs       Tail API logs"
	@echo "  make prisma     Open Prisma CLI shell"
	@echo "  make db         Open Postgres shell"
	@echo ""
	@echo "  make prod       Build + start prod stack"
	@echo "  make prod-down  Stop prod stack"
	@echo ""

# -----------------------------
# Development
# -----------------------------
.PHONY: dev
dev:
	docker compose -f $(DEV_COMPOSE) up

.PHONY: dev-build
dev-build:
	docker compose -f $(DEV_COMPOSE) up --build

.PHONY: dev-down
dev-down:
	docker compose -f $(DEV_COMPOSE) down

.PHONY: logs
logs:
	docker compose -f $(DEV_COMPOSE) logs -f $(API_SERVICE)

# -----------------------------
# Prisma / DB helpers
# -----------------------------
.PHONY: prisma
prisma:
	docker compose -f $(DEV_COMPOSE) exec $(API_SERVICE) sh

.PHONY: db
db:
	docker compose -f $(DEV_COMPOSE) exec db psql -U postgres volunteer

# -----------------------------
# Production
# -----------------------------
.PHONY: prod
prod:
	docker compose -f $(PROD_COMPOSE) up --build -d

.PHONY: prod-down
prod-down:
	docker compose -f $(PROD_COMPOSE) down