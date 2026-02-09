# API Reference - Quick Guide

Base URL: `http://localhost:3000/api`

## Authentication Required

All endpoints except `/auth/login` require the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

---

## 🔐 Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!"
}

Response 200:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}

Response 200:
{
  "accessToken": "eyJ..."
}
```

### Logout
```http
POST /auth/logout

Response 204: No Content
```

---

## 👤 Users

### Get Current User
```http
GET /users/me

Response 200:
{
  "id": "uuid",
  "email": "admin@example.com",
  "fullName": "System Administrator",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## 📦 Products

### List Products
```http
GET /products?q=widget&isActive=true&unitOfMeasure=PCS&page=1&limit=10

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "sku": "WIDGET-001",
      "name": "Standard Widget",
      "unitOfMeasure": "PCS",
      "isActive": true,
      "stock": 100,
      "version": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

**Query Parameters:**
- `q` (string) - Search by SKU or name
- `isActive` (boolean) - Filter by active status
- `unitOfMeasure` (string) - Filter by unit of measure
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

### Get Product by ID
```http
GET /products/:id

Response 200:
{
  "id": "uuid",
  "sku": "WIDGET-001",
  "name": "Standard Widget",
  "unitOfMeasure": "PCS",
  "isActive": true,
  "stock": 100,
  "version": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Create Product
```http
POST /products
Content-Type: application/json

{
  "sku": "NEW-PROD-001",
  "name": "New Product",
  "unitOfMeasure": "PCS",
  "isActive": true
}

Response 201:
{
  "id": "uuid",
  "sku": "NEW-PROD-001",
  "name": "New Product",
  "unitOfMeasure": "PCS",
  "isActive": true,
  "stock": 0,
  "version": 1,
  ...
}
```

**Validation:**
- `sku` - Required, 1-64 chars, must be unique
- `name` - Required, 1-120 chars
- `unitOfMeasure` - Required, max 16 chars, pattern: `[A-Za-z0-9._-]+`
- `isActive` - Optional, boolean (default: true)

### Update Product
```http
PUT /products/:id
Content-Type: application/json

{
  "name": "Updated Product Name",
  "isActive": false
}

Response 200:
{
  "id": "uuid",
  "sku": "NEW-PROD-001",
  "name": "Updated Product Name",
  "isActive": false,
  ...
}
```

### Delete Product
```http
DELETE /products/:id

Response 204: No Content
```

---

## 📊 Inventory Movements

### List Movements
```http
GET /movements?status=POSTED&movementType=OUT&page=1&limit=10

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "movementType": "OUT",
      "status": "POSTED",
      "reference": "SO-12345",
      "notes": "Sales order",
      "createdBy": "user-uuid",
      "creator": {
        "id": "user-uuid",
        "email": "admin@example.com",
        "fullName": "System Administrator"
      },
      "items": [
        {
          "id": "item-uuid",
          "productId": "product-uuid",
          "product": {
            "id": "product-uuid",
            "sku": "WIDGET-001",
            "name": "Standard Widget"
          },
          "quantity": 10,
          "unitOfMeasure": "PCS"
        }
      ],
      "postedAt": "2024-01-01T10:00:00Z",
      "createdAt": "2024-01-01T09:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Query Parameters:**
- `status` (enum) - Filter by status: DRAFT, POSTED, CANCELLED
- `movementType` (enum) - Filter by type: IN, OUT, ADJUST, TRANSFER
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

### Get Movement by ID
```http
GET /movements/:id

Response 200:
{
  "id": "uuid",
  "movementType": "IN",
  "status": "DRAFT",
  "reference": "PO-001",
  "notes": "Purchase order",
  "createdBy": "user-uuid",
  "creator": { ... },
  "items": [ ... ],
  "postedAt": null,
  "createdAt": "2024-01-01T09:00:00Z",
  "updatedAt": "2024-01-01T09:00:00Z"
}
```

### Create Movement
```http
POST /movements
Content-Type: application/json

{
  "movementType": "IN",
  "reference": "PO-12345",
  "notes": "Received from supplier",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 50,
      "unitOfMeasure": "PCS"
    },
    {
      "productId": "another-product-uuid",
      "quantity": 100,
      "unitOfMeasure": "PCS"
    }
  ]
}

Response 201:
{
  "id": "new-movement-uuid",
  "movementType": "IN",
  "status": "DRAFT",
  "reference": "PO-12345",
  ...
}
```

**Validation:**
- `movementType` - Required, enum: IN, OUT, ADJUST, TRANSFER
- `reference` - Optional, max 120 chars
- `notes` - Optional, text
- `items` - Required, array with at least 1 item
  - `productId` - Required, UUID, must exist
  - `quantity` - Required, integer > 0
  - `unitOfMeasure` - Required, must match product's UoM

### Update Movement (DRAFT only)
```http
PUT /movements/:id
Content-Type: application/json

{
  "reference": "PO-12345-UPDATED",
  "notes": "Updated notes"
}

Response 200:
{
  "id": "uuid",
  "reference": "PO-12345-UPDATED",
  "notes": "Updated notes",
  ...
}

Error 409 (if not DRAFT):
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot update movement that is not in DRAFT status"
  }
}
```

### Delete Movement (DRAFT only)
```http
DELETE /movements/:id

Response 204: No Content

Error 409 (if not DRAFT):
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot delete movement that is not in DRAFT status"
  }
}
```

### Add Item to Movement
```http
POST /movements/:id/items
Content-Type: application/json

{
  "productId": "product-uuid",
  "quantity": 25,
  "unitOfMeasure": "PCS"
}

Response 201:
{
  "id": "movement-uuid",
  "items": [
    // All items including the new one
  ],
  ...
}
```

### Remove Item from Movement
```http
DELETE /movements/items/:itemId

Response 204: No Content
```

### Post Movement (Update Stock) 🔥
```http
POST /movements/:id/post

Response 200:
{
  "id": "movement-uuid",
  "status": "POSTED",
  "postedAt": "2024-01-01T10:00:00Z",
  ...
}

Error 409 (insufficient stock):
{
  "timestamp": "2024-01-01T10:00:00Z",
  "path": "/api/movements/uuid/post",
  "method": "POST",
  "status": 409,
  "error": {
    "code": "STOCK_UNDERFLOW",
    "message": "Cannot post movement: Product WIDGET-001 would have negative stock",
    "details": {
      "productId": "product-uuid",
      "sku": "WIDGET-001",
      "currentStock": 5,
      "requestedChange": -10,
      "resultingStock": -5
    }
  },
  "correlationId": "uuid"
}
```

**Important:**
- Only DRAFT movements can be posted
- Posting is transactional and uses FOR UPDATE locks
- Once posted, movement cannot be modified
- Stock changes are applied atomically
- Validates no negative stock before committing

**Rate Limited**: 10 requests per minute

### Cancel Movement (DRAFT only)
```http
POST /movements/:id/cancel

Response 200:
{
  "id": "movement-uuid",
  "status": "CANCELLED",
  ...
}
```

---

## 📈 Dashboard

### Get Dashboard Summary
```http
GET /dashboard/summary

Response 200:
{
  "totalProducts": 15,
  "activeProducts": 14,
  "totalStock": 2345,
  "lowStockCount": 3,
  "recentMovements": [
    {
      "id": "uuid",
      "movementType": "OUT",
      "status": "POSTED",
      "reference": "SO-123",
      "createdBy": "user-uuid",
      "creatorName": "System Administrator",
      "itemCount": 2,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "chartData": [
    {
      "date": "2024-01-01",
      "movementType": "IN",
      "count": 5
    },
    {
      "date": "2024-01-01",
      "movementType": "OUT",
      "count": 3
    }
  ]
}
```

**Metrics:**
- `totalProducts` - Count of all products
- `activeProducts` - Count of active products (isActive = true)
- `totalStock` - Sum of stock across all products
- `lowStockCount` - Count of products with stock < 10
- `recentMovements` - Last 10 movements
- `chartData` - 30-day movement trends grouped by date and type

---

## 🚨 Error Responses

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `STOCK_UNDERFLOW` | 409 | Insufficient stock for operation |
| `INVALID_STATE_TRANSITION` | 409 | Invalid movement status change |
| `RESOURCE_NOT_FOUND` | 404 | Entity not found |
| `CONFLICT` | 409 | Duplicate SKU, validation errors |
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Inactive user account |
| `VALIDATION_ERROR` | 400 | Request validation failed |

### Error Response Format
```json
{
  "timestamp": "2024-01-01T10:00:00Z",
  "path": "/api/endpoint",
  "method": "POST",
  "status": 409,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional context
    }
  },
  "correlationId": "uuid"
}
```

---

## 💡 Usage Examples

### Example 1: Complete Movement Lifecycle

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

# 2. Get a product ID
PRODUCT_ID=$(curl -s "http://localhost:3000/api/products?limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].id')

# 3. Create movement
MOVEMENT_ID=$(curl -s -X POST http://localhost:3000/api/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"movementType\": \"IN\",
    \"reference\": \"PO-001\",
    \"items\": [{
      \"productId\": \"$PRODUCT_ID\",
      \"quantity\": 50,
      \"unitOfMeasure\": \"PCS\"
    }]
  }" | jq -r '.id')

# 4. Post movement
curl -X POST "http://localhost:3000/api/movements/$MOVEMENT_ID/post" \
  -H "Authorization: Bearer $TOKEN"
```

### Example 2: Search and Filter

```bash
# Search products
curl "http://localhost:3000/api/products?q=widget&isActive=true" \
  -H "Authorization: Bearer $TOKEN"

# Filter movements by status
curl "http://localhost:3000/api/movements?status=POSTED&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Example 3: Dashboard Analytics

```bash
# Get dashboard summary
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.totalStock, .lowStockCount'
```

---

## 🔧 Testing Tips

1. **Use jq for JSON parsing**:
   ```bash
   curl ... | jq '.data[] | {sku, stock}'
   ```

2. **Save tokens to variables**:
   ```bash
   export TOKEN="your-access-token"
   ```

3. **Pretty print responses**:
   ```bash
   curl ... | jq '.'
   ```

4. **Test error cases**:
   ```bash
   # Try to post with insufficient stock
   # Try to update POSTED movement
   # Try to delete non-existent product
   ```

5. **Check correlation IDs in logs**:
   ```bash
   docker-compose logs -f backend | grep "correlation-id"
   ```

---

## 📚 Additional Resources

- **README.md** - Full documentation and architecture
- **GETTING_STARTED.md** - Step-by-step setup guide
- **IMPLEMENTATION_SUMMARY.md** - Implementation status and next steps

---

**Last Updated**: 2024-01-15
**API Version**: 1.0.0
