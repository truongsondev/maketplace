# Quick Start Guide - Admin Module

## 🎯 Overview

The admin module provides APIs for product management following Clean Architecture principles.

## 📁 Module Structure

```
src/module/admin/
├── applications/      # Business logic & use cases
├── entities/          # Domain models
├── infrastructure/    # External integrations (DB, API)
├── interface-adapter/# Controllers & presenters
└── di.ts             # Dependency injection
```

## 🚀 Getting Started

### 1. Database Setup

Ensure your database is running and migrations are applied:

```bash
npm run migrate:dev
```

### 2. Start the Server

```bash
npm run dev
```

Server will start on port 8080 (or PORT from .env)

### 3. Test the API

Use the provided HTTP file or curl:

```bash
curl -X POST http://localhost:8080/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @example-request.json
```

## 📝 Available Endpoints

### Create Product

- **Method**: POST
- **Path**: `/api/admin/products`
- **Auth**: Required
- **Response**: 201 Created

## 🔍 Example Request

Minimal product creation:

```json
{
  "name": "Sample Product",
  "basePrice": 99.99,
  "variants": [
    {
      "sku": "PROD-001",
      "attributes": { "size": "M" },
      "price": 99.99,
      "stockAvailable": 50
    }
  ]
}
```

## 📚 Documentation

- **API Docs**: [doc-api/create-product.md](../../doc-api/create-product.md)
- **HTTP Examples**: [doc-api/create-product.http](../../doc-api/create-product.http)
- **Module Details**: [README.md](./README.md)

## 🧪 Testing

Run tests:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

## 🏗️ Architecture Highlights

### Clean Architecture Layers:

1. **Domain** (entities/) - Business logic
2. **Application** (applications/) - Use cases
3. **Interface Adapters** (interface-adapter/) - Controllers
4. **Infrastructure** (infrastructure/) - External systems

### Key Features:

- ✅ Transaction safety
- ✅ Input validation
- ✅ SKU uniqueness check
- ✅ Multi-variant support
- ✅ Image management
- ✅ Category & tag linking
- ✅ Comprehensive error handling

## 🛠️ Development

### Adding New Endpoints

1. Create entity in `entities/`
2. Define use case in `applications/usecases/`
3. Create repository interface in `applications/ports/output/`
4. Implement repository in `infrastructure/repositories/`
5. Create controller in `interface-adapter/controller/`
6. Define API routes in `infrastructure/api/`
7. Wire dependencies in `di.ts`

### Project Structure Pattern

Follow the same structure as the auth module:

- Use interfaces (ports) for dependency inversion
- Keep entities pure (no external dependencies)
- Use cases contain business logic
- Repositories handle data access
- Controllers orchestrate requests

## 🔒 Authentication

All admin endpoints require authentication. Include JWT token in headers:

```
Authorization: Bearer <your-token>
```

## ❗ Error Responses

| Status | Error        | Description              |
| ------ | ------------ | ------------------------ |
| 400    | Bad Request  | Invalid input data       |
| 401    | Unauthorized | Missing or invalid token |
| 409    | Conflict     | Duplicate SKU            |
| 500    | Server Error | Internal error           |

## 📊 Database Tables Used

- `products` - Product information
- `product_variants` - Variants with inventory
- `product_images` - Image URLs
- `product_categories` - Product-category links
- `product_tags` - Product-tag links

## 🔄 Transaction Flow

```
Request → Validation → Use Case → Repository → Database
                ↓
           Response ← Controller ← Use Case Result
```

## 📞 Support

For issues or questions:

1. Check documentation in `doc-api/`
2. Review module README
3. Check Prisma schema in `prisma/schema.prisma`

## 🎓 Learning Resources

- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Hexagonal Architecture: https://alistair.cockburn.us/hexagonal-architecture/
- Domain-Driven Design: https://martinfowler.com/bliki/DomainDrivenDesign.html

## ✅ Checklist for New Features

- [ ] Create domain entity with validation
- [ ] Define use case interface (port)
- [ ] Implement use case with business logic
- [ ] Create repository interface
- [ ] Implement repository with database access
- [ ] Create controller for orchestration
- [ ] Define API routes and validation
- [ ] Wire dependencies in DI container
- [ ] Write tests
- [ ] Document API endpoint
- [ ] Update README

---

**Happy Coding! 🚀**
