# inventory-scis: Full-Stack Inventory Management System

A production-grade inventory management system with comprehensive features for product management, inventory movements with transactional posting, and real-time dashboards.

## 🏗️ Architecture

**Backend**: NestJS + TypeScript + PostgreSQL + TypeORM
**Frontend**: React + TypeScript + Vite + Material UI + React Query (To be implemented)
**Infrastructure**: Docker Compose for containerized deployment

## ✨ Implemented Features

### Backend

#### 1. **Authentication & Authorization**
- JWT-based authentication with access & refresh tokens
- Access token TTL: 15 minutes
- Refresh token TTL: 7 days
- Password hashing with bcrypt
- Active user validation
- Protected routes with JWT guards

#### 2. **Products Management**
- Full CRUD operations
- SKU uniqueness validation
- Unit of measure validation with regex pattern
- Active/Inactive status
- Stock tracking with optimistic locking (version column)
- Advanced filtering: search, status, unit of measure
- Pagination support

#### 3. **Inventory Movements**
- **Movement Types**: IN, OUT, ADJUST, TRANSFER
- **Movement Status**: DRAFT, POSTED, CANCELLED
- **State Machine**:
  - Create movements in DRAFT status
  - Add/remove items only in DRAFT
  - Post to update stock levels (irreversible)
  - Cancel only in DRAFT status

##### **Transactional Posting Logic** (Most Critical Implementation)
```typescript
// Key Features:
- Database transactions with TypeORM QueryRunner
- Pessimistic locking (FOR UPDATE) on products
- Atomic stock updates
- Stock underflow prevention
- Rollback on any error
- Race condition handling
```

**Posting Flow**:
1. Load movement with items
2. Lock all affected products with `FOR UPDATE`
3. Calculate stock deltas based on movement type
4. Validate no negative stock
5. Update product stock levels
6. Mark movement as POSTED
7. Commit transaction or rollback on error

#### 4. **Dashboard & Analytics**
- Total products count
- Active products count
- Total stock (sum across all products)
- Low stock alerts (< 10 units)
- Recent movements (last 10)
- Chart data (30-day movement trends by type)

#### 5. **Infrastructure & Security**
- Global exception filter with correlation IDs
- Consistent error response format
- Custom exceptions (StockUnderflow, InvalidStateTransition, ResourceNotFound)
- Rate limiting with @nestjs/throttler
- CORS configuration
- Helmet security middleware
- Request/response logging
- Validation pipes with class-validator

## 📁 Project Structure

```
inventory-scis/
├── backend/
│   ├── src/
│   │   ├── common/           # Cross-cutting concerns
│   │   │   ├── config/       # Configuration
│   │   │   ├── exceptions/   # Custom exceptions
│   │   │   ├── filters/      # Exception filters
│   │   │   ├── guards/       # Auth guards
│   │   │   └── middleware/   # Middleware (correlation ID)
│   │   ├── core/             # Domain layer
│   │   │   ├── entities/     # TypeORM entities
│   │   │   └── repositories/ # Repository interfaces
│   │   ├── infra/            # Infrastructure layer
│   │   │   ├── database/     # Migrations, seeds, ORM config
│   │   │   └── repositories/ # Repository implementations
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── users/        # User management
│   │   │   ├── products/     # Products CRUD
│   │   │   ├── inventory/    # Inventory movements
│   │   │   └── dashboard/    # Dashboard & analytics
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                 # Tests (to be implemented)
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/                 # (To be implemented)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### 1. Clone and Setup

```bash
cd inventory-scis

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Optional: Edit .env files with your settings
```

### 2. Start Services

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d --build

# Watch logs
docker-compose logs -f
```

### 3. Run Migrations & Seeds

```bash
# Run database migrations
docker-compose exec backend npm run migration:run

# Seed initial data (admin user + sample products)
docker-compose exec backend npm run seed
```

### 4. Access the Application

- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health
- **Frontend**: http://localhost:5173 (To be implemented)

### Default Credentials

```
Email: admin@example.com
Password: Admin123!
```

## API Endpoints

### Authentication
```
POST   /api/auth/login         - Login with email & password
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/logout        - Logout
```

### Users
```
GET    /api/users/me           - Get current user profile
```

### Products
```
GET    /api/products           - List products (with filters & pagination)
GET    /api/products/:id       - Get product by ID
POST   /api/products           - Create product
PUT    /api/products/:id       - Update product
DELETE /api/products/:id       - Delete product
```

**Query Parameters for GET /api/products**:
- `q` - Search by SKU or name
- `isActive` - Filter by active status (true/false)
- `unitOfMeasure` - Filter by unit of measure
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Inventory Movements
```
GET    /api/movements                 - List movements (with filters & pagination)
GET    /api/movements/:id             - Get movement by ID
POST   /api/movements                 - Create movement (DRAFT)
PUT    /api/movements/:id             - Update movement (DRAFT only)
DELETE /api/movements/:id             - Delete movement (DRAFT only)
POST   /api/movements/:id/items       - Add item to movement
DELETE /api/movements/items/:itemId   - Remove item from movement
POST   /api/movements/:id/post        - Post movement (update stock)
POST   /api/movements/:id/cancel      - Cancel movement
```

**Query Parameters for GET /api/movements**:
- `status` - Filter by status (DRAFT, POSTED, CANCELLED)
- `movementType` - Filter by type (IN, OUT, ADJUST, TRANSFER)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Dashboard
```
GET    /api/dashboard/summary  - Get dashboard summary with KPIs
```

## Authentication Flow

1. **Login**: POST `/api/auth/login` with email & password
   ```json
   {
     "email": "admin@example.com",
     "password": "Admin123!"
   }
   ```
   Response:
   ```json
   {
     "accessToken": "eyJhbGc...",
     "refreshToken": "eyJhbGc..."
   }
   ```

2. **Use Access Token**: Include in Authorization header
   ```
   Authorization: Bearer <accessToken>
   ```

3. **Refresh Token**: When access token expires, POST `/api/auth/refresh`
   ```json
   {
     "refreshToken": "eyJhbGc..."
   }
   ```

## Inventory Movement Workflow

### Creating and Posting a Movement

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# 2. Create movement (DRAFT)
curl -X POST http://localhost:3000/api/movements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "movementType": "OUT",
    "reference": "SO-12345",
    "notes": "Sales order fulfillment",
    "items": [
      {
        "productId": "<product-uuid>",
        "quantity": 10,
        "unitOfMeasure": "PCS"
      }
    ]
  }'

# 3. Post movement (updates stock)
curl -X POST http://localhost:3000/api/movements/<movement-id>/post \
  -H "Authorization: Bearer <token>"
```

### Movement Type Behavior

| Type | Stock Change | Use Case |
|------|-------------|----------|
| `IN` | +quantity | Receiving goods, purchase orders |
| `OUT` | -quantity | Sales, shipments, consumption |
| `ADJUST` | +/- quantity | Stock corrections, cycle counts |
| `TRANSFER` | 0 | Location transfers (no net change) |

## Error Handling

All errors follow a consistent format:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/movements/123/post",
  "method": "POST",
  "status": 409,
  "error": {
    "code": "STOCK_UNDERFLOW",
    "message": "Cannot post movement: Product WIDGET-001 would have negative stock",
    "details": {
      "productId": "uuid",
      "sku": "WIDGET-001",
      "currentStock": 5,
      "requestedChange": -10,
      "resultingStock": -5
    }
  },
  "correlationId": "uuid"
}
```

### Common Error Codes

- `STOCK_UNDERFLOW` (409) - Insufficient stock for operation
- `INVALID_STATE_TRANSITION` (409) - Invalid movement status change
- `RESOURCE_NOT_FOUND` (404) - Entity not found
- `CONFLICT` (409) - Duplicate SKU, validation errors
- `UNAUTHORIZED` (401) - Invalid or expired token
- `FORBIDDEN` (403) - Inactive user account

## Testing (To be implemented)

```bash
# Backend unit tests
make test-backend

# Backend integration tests (includes concurrency tests)
cd backend && npm run test:e2e

# Frontend tests
make test-frontend
```

### Critical Test Cases

The most important test to validate is **concurrent posting**:

```typescript
// Tests that pessimistic locking prevents race conditions
it('should handle concurrent OUT postings with proper locking', async () => {
  // Setup: Product with stock = 10
  // Movement1: OUT 8 units, Movement2: OUT 5 units
  // Post both concurrently

  // Expected: One succeeds, one fails with 409 STOCK_UNDERFLOW
});
```

## Development

### Makefile Commands

```bash
make up              # Start all services
make down            # Stop all services
make logs            # Show logs
make restart         # Restart services
make clean           # Stop and remove volumes

make migrate         # Run migrations
make migrate-revert  # Revert last migration
make seed            # Seed database

make test-backend    # Run backend tests
make test-frontend   # Run frontend tests

make db-shell        # Open PostgreSQL shell
make backend-shell   # Open backend container shell
make frontend-shell  # Open frontend container shell
```

### Local Development (without Docker)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with local PostgreSQL URL
npm run migration:run
npm run seed
npm run start:dev

# Frontend (to be implemented)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Database Schema

### Key Tables

**users**
- id (uuid, pk)
- email (unique)
- full_name
- password_hash
- is_active
- timestamps

**products**
- id (uuid, pk)
- sku (unique, indexed)
- name
- unit_of_measure
- is_active (indexed)
- stock (integer, check >= 0)
- version (optimistic locking)
- timestamps

**inventory_movements**
- id (uuid, pk)
- movement_type (enum: IN, OUT, ADJUST, TRANSFER)
- status (enum: DRAFT, POSTED, CANCELLED, indexed)
- reference
- notes
- created_by (fk users, indexed)
- posted_at
- timestamps

**inventory_movement_items**
- id (uuid, pk)
- movement_id (fk, cascade delete)
- product_id (fk, indexed)
- quantity (> 0)
- unit_of_measure
- timestamps


## Key Design Decisions

### 1. **Pessimistic Locking for Stock Updates**
- Uses `FOR UPDATE` to lock product rows during posting
- Prevents race conditions when multiple movements affect same product
- Trade-off: Slight performance impact for data consistency guarantee

### 2. **Movement State Machine**
- Enforces clear lifecycle: DRAFT → POSTED/CANCELLED
- Posted movements are immutable (audit trail)
- Prevents accidental stock corruption

### 3. **Clean Architecture**
- Separation: Entities (core) → Repositories (infra) → Services (modules)
- Dependency inversion: Core doesn't depend on infrastructure
- Testability: Easy to mock repositories for unit tests

### 4. **TypeORM with Migrations**
- Schema versioning for controlled changes
- No `synchronize: true` in production
- Explicit migrations for audit trail

### 5. **JWT with Refresh Tokens**
- Short-lived access tokens (15min) for security
- Long-lived refresh tokens (7d) for UX
- Stateless authentication (no session storage)

## Important Notes

### Stock Consistency Guarantees

The system guarantees stock consistency through:
1. Database check constraint: `stock >= 0`
2. Application-level validation before posting
3. Pessimistic locking during transactions
4. Atomic updates within transactions

### Scalability Considerations

- Pessimistic locking can be a bottleneck at high concurrency
- Consider optimistic locking + retry for read-heavy workloads
- Implement caching for dashboard queries
- Use read replicas for reporting

### Security Best Practices

- Never commit `.env` files
- Rotate JWT secrets regularly
- Implement token blacklisting for logout
- Use HTTPS in production
- Enable database SSL connections
- Implement audit logging for sensitive operations

---

**Built with using NestJS, React, and TypeScript**
