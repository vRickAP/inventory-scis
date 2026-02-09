# Getting Started with inventory-scis

This guide will help you quickly set up and start using the inventory-scis backend system.

## ⚡ Quick Setup (5 minutes)

### Step 1: Environment Setup

```bash
cd inventory-scis

# Create environment file for backend
cp backend/.env.example backend/.env

# Optional: Edit backend/.env if needed
# Default settings work out of the box
```

### Step 2: Start the System

```bash
# Start all services (PostgreSQL + Backend)
docker-compose up -d --build

# This will:
# - Start PostgreSQL on port 5432
# - Start Backend API on port 3000
# - Create necessary networks and volumes

# Wait ~30 seconds for services to be ready
# Check status:
docker-compose ps
```

### Step 3: Initialize Database

```bash
# Run migrations to create tables
docker-compose exec backend npm run migration:run

# Seed with admin user and sample products
docker-compose exec backend npm run seed
```

### Step 4: Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

## 🎉 You're Ready!

The backend is now running at **http://localhost:3000/api**

Default credentials:
- Email: `admin@example.com`
- Password: `Admin123!`

## 🧪 Testing the API

### 1. Login and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the accessToken** - you'll need it for all subsequent requests.

### 2. Get Your Profile

```bash
# Replace <TOKEN> with your accessToken
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

### 3. List Products

```bash
curl "http://localhost:3000/api/products?page=1&limit=5" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response shows 5 sample products with stock levels:**
```json
{
  "data": [
    {
      "id": "uuid...",
      "sku": "WIDGET-001",
      "name": "Standard Widget",
      "unitOfMeasure": "PCS",
      "isActive": true,
      "stock": 100,
      ...
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 5,
  "totalPages": 3
}
```

### 4. Create a New Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "MY-PRODUCT-001",
    "name": "My Test Product",
    "unitOfMeasure": "PCS",
    "isActive": true
  }'
```

### 5. Create an Inventory Movement (DRAFT)

```bash
# First, get a product ID from step 3
# Then create a movement:

curl -X POST http://localhost:3000/api/movements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "movementType": "IN",
    "reference": "PO-12345",
    "notes": "Received from supplier",
    "items": [
      {
        "productId": "<PRODUCT_ID_FROM_STEP_3>",
        "quantity": 50,
        "unitOfMeasure": "PCS"
      }
    ]
  }'
```

**Response:**
```json
{
  "id": "movement-uuid...",
  "movementType": "IN",
  "status": "DRAFT",
  "reference": "PO-12345",
  ...
}
```

### 6. Post the Movement (Update Stock)

```bash
# Replace <MOVEMENT_ID> with the ID from step 5
curl -X POST http://localhost:3000/api/movements/<MOVEMENT_ID>/post \
  -H "Authorization: Bearer <TOKEN>"
```

**This will:**
- Lock the product row
- Add 50 units to stock
- Change movement status to POSTED
- Return the updated movement

### 7. Verify Stock Updated

```bash
# Get the product again
curl http://localhost:3000/api/products/<PRODUCT_ID> \
  -H "Authorization: Bearer <TOKEN>"

# The stock should now be increased by 50
```

### 8. View Dashboard

```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer <TOKEN>"
```

**Response includes:**
- Total products count
- Active products count
- Total stock across all products
- Low stock alerts
- Recent movements
- Chart data for last 30 days

## 🎯 Common Workflows

### Workflow 1: Receiving Goods (IN Movement)

```bash
# 1. Create IN movement
curl -X POST http://localhost:3000/api/movements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "movementType": "IN",
    "reference": "PO-100",
    "notes": "Purchase order",
    "items": [
      {"productId": "<ID1>", "quantity": 100, "unitOfMeasure": "PCS"},
      {"productId": "<ID2>", "quantity": 50, "unitOfMeasure": "PCS"}
    ]
  }'

# 2. Review the movement (optional)
curl http://localhost:3000/api/movements/<MOVEMENT_ID> \
  -H "Authorization: Bearer <TOKEN>"

# 3. Post to update stock
curl -X POST http://localhost:3000/api/movements/<MOVEMENT_ID>/post \
  -H "Authorization: Bearer <TOKEN>"
```

### Workflow 2: Shipping Goods (OUT Movement)

```bash
# 1. Create OUT movement
curl -X POST http://localhost:3000/api/movements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "movementType": "OUT",
    "reference": "SO-200",
    "notes": "Sales order fulfillment",
    "items": [
      {"productId": "<ID>", "quantity": 25, "unitOfMeasure": "PCS"}
    ]
  }'

# 2. Post to decrease stock
curl -X POST http://localhost:3000/api/movements/<MOVEMENT_ID>/post \
  -H "Authorization: Bearer <TOKEN>"
```

### Workflow 3: Stock Adjustment

```bash
# For cycle count corrections
curl -X POST http://localhost:3000/api/movements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "movementType": "ADJUST",
    "reference": "ADJ-001",
    "notes": "Cycle count correction",
    "items": [
      {"productId": "<ID>", "quantity": 5, "unitOfMeasure": "PCS"}
    ]
  }'

# Post to adjust (can be positive or negative)
curl -X POST http://localhost:3000/api/movements/<MOVEMENT_ID>/post \
  -H "Authorization: Bearer <TOKEN>"
```

## 🔍 Testing Stock Underflow Prevention

The system prevents negative stock. Try this:

```bash
# 1. Find a product with low stock (e.g., stock = 10)
curl "http://localhost:3000/api/products?page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"

# 2. Try to create OUT movement for more than available
curl -X POST http://localhost:3000/api/movements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "movementType": "OUT",
    "reference": "TEST-UNDERFLOW",
    "items": [
      {"productId": "<ID_WITH_STOCK_10>", "quantity": 15, "unitOfMeasure": "PCS"}
    ]
  }'

# 3. Try to post (this will fail)
curl -X POST http://localhost:3000/api/movements/<MOVEMENT_ID>/post \
  -H "Authorization: Bearer <TOKEN>"

# Expected response: 409 Conflict with STOCK_UNDERFLOW error
```

## 📊 Using Filters and Pagination

### Filter Products

```bash
# Search by SKU or name
curl "http://localhost:3000/api/products?q=widget" \
  -H "Authorization: Bearer <TOKEN>"

# Filter by active status
curl "http://localhost:3000/api/products?isActive=true" \
  -H "Authorization: Bearer <TOKEN>"

# Filter by unit of measure
curl "http://localhost:3000/api/products?unitOfMeasure=PCS" \
  -H "Authorization: Bearer <TOKEN>"

# Combine filters
curl "http://localhost:3000/api/products?q=motor&isActive=true&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

### Filter Movements

```bash
# Filter by status
curl "http://localhost:3000/api/movements?status=POSTED" \
  -H "Authorization: Bearer <TOKEN>"

# Filter by type
curl "http://localhost:3000/api/movements?movementType=OUT" \
  -H "Authorization: Bearer <TOKEN>"

# Combine filters
curl "http://localhost:3000/api/movements?status=DRAFT&movementType=IN&page=1" \
  -H "Authorization: Bearer <TOKEN>"
```

## 🛠️ Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# PostgreSQL only
docker-compose logs -f postgres
```

### Database Access

```bash
# Open PostgreSQL shell
docker-compose exec postgres psql -U inventory_user -d inventory_scis

# Once inside:
# \dt              - List tables
# SELECT * FROM products;
# SELECT * FROM inventory_movements;
# \q               - Exit
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Stop and Clean Up

```bash
# Stop services (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## 🐛 Troubleshooting

### Problem: Port already in use

```bash
# Check what's using port 3000
# Windows:
netstat -ano | findstr :3000

# Change port in docker-compose.yml:
services:
  backend:
    ports:
      - "3001:3000"  # Change left side
```

### Problem: Migration fails

```bash
# Reset database
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migration:run
docker-compose exec backend npm run seed
```

### Problem: Token expired

```bash
# Use refresh token to get new access token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<YOUR_REFRESH_TOKEN>"}'
```

### Problem: Can't connect to database

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

## 📚 Next Steps

1. **Explore the API**: Try all endpoints with different parameters
2. **Test edge cases**: Try posting movements with invalid data
3. **Check the dashboard**: Create several movements and view analytics
4. **Build a frontend**: Connect a React app to this API
5. **Add tests**: Write integration tests for critical workflows

## 🔗 Resources

- **API Documentation**: See README.md for full endpoint reference
- **Architecture**: See README.md for system design decisions
- **Postman Collection**: Consider creating one for easier testing

---

**Happy coding! 🚀**

If you encounter any issues, check the logs with `docker-compose logs -f` or open an issue on GitHub.
