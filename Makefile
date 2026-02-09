.PHONY: help up down logs restart clean migrate migrate-revert seed test-backend test-frontend test install

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies for backend and frontend
	cd backend && npm install
	cd frontend && npm install

up: ## Start all services
	docker-compose up -d --build

down: ## Stop all services
	docker-compose down

logs: ## Show logs from all services
	docker-compose logs -f

restart: ## Restart all services
	docker-compose restart

clean: ## Stop services and remove volumes
	docker-compose down -v

migrate: ## Run database migrations
	docker-compose exec backend npm run migration:run

migrate-revert: ## Revert last migration
	docker-compose exec backend npm run migration:revert

seed: ## Run database seeds
	docker-compose exec backend npm run seed

test-backend: ## Run backend tests
	cd backend && npm test

test-frontend: ## Run frontend tests
	cd frontend && npm test

test: test-backend test-frontend ## Run all tests

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U inventory_user -d inventory_scis

backend-shell: ## Open backend container shell
	docker-compose exec backend sh

frontend-shell: ## Open frontend container shell
	docker-compose exec frontend sh
