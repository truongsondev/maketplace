# Admin Module Architecture Diagram

## 🏛️ Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP REQUEST                              │
│                    POST /api/admin/products                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────▼─────────────────┐
                │   INFRASTRUCTURE LAYER          │
                │   (infrastructure/api)          │
                │                                 │
                │   ProductAPI                    │
                │   - Route handlers              │
                │   - Input validation            │
                │   - HTTP error mapping          │
                └───────────────┬─────────────────┘
                                │
                ┌───────────────▼─────────────────┐
                │   INTERFACE ADAPTER LAYER       │
                │   (interface-adapter)           │
                │                                 │
                │   ProductController             │
                │   - Request orchestration       │
                │   - DTO transformation          │
                └───────────────┬─────────────────┘
                                │
                ┌───────────────▼─────────────────┐
                │   APPLICATION LAYER             │
                │   (applications)                │
                │                                 │
                │   CreateProductUseCase          │
                │   - Business rules              │
                │   - Validation logic            │
                │   - Transaction orchestration   │
                └───────────────┬─────────────────┘
                                │
                ┌───────────────▼─────────────────┐
                │   DOMAIN LAYER                  │
                │   (entities)                    │
                │                                 │
                │   Product Entity                │
                │   ProductVariant Entity         │
                │   - Core business logic         │
                │   - Domain rules                │
                └───────────────┬─────────────────┘
                                │
                ┌───────────────▼─────────────────┐
                │   INFRASTRUCTURE LAYER          │
                │   (infrastructure/repositories) │
                │                                 │
                │   PrismaProductRepository       │
                │   - Database operations         │
                │   - Query building              │
                │   - Transaction management      │
                └───────────────┬─────────────────┘
                                │
                ┌───────────────▼─────────────────┐
                │          DATABASE               │
                │   (MySQL via Prisma)            │
                │                                 │
                │   Tables:                       │
                │   - products                    │
                │   - product_variants            │
                │   - product_images              │
                │   - product_categories          │
                │   - product_tags                │
                └─────────────────────────────────┘
```

## 🔄 Data Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ JSON Request
       ▼
┌─────────────────────────────────────────────┐
│           ProductAPI (Route Handler)         │
│  • Validates request structure               │
│  • Checks required fields                    │
│  • Validates data types                      │
└──────┬──────────────────────────────────────┘
       │ CreateProductCommand
       ▼
┌─────────────────────────────────────────────┐
│         ProductController                    │
│  • Receives command                          │
│  • Calls use case                            │
│  • Returns response                          │
└──────┬──────────────────────────────────────┘
       │ CreateProductCommand
       ▼
┌─────────────────────────────────────────────┐
│       CreateProductUseCase                   │
│  • Validates business rules                  │
│  • Checks SKU uniqueness                     │
│  • Creates domain entities                   │
│  • Orchestrates repository calls             │
└──────┬──────────────────────────────────────┘
       │ Product + Variants + Images + Relationships
       ▼
┌─────────────────────────────────────────────┐
│     PrismaProductRepository                  │
│  • Begins transaction                        │
│  • Creates product record                    │
│  • Creates variant records                   │
│  • Creates image records                     │
│  • Links categories                          │
│  • Links tags                                │
│  • Commits transaction                       │
└──────┬──────────────────────────────────────┘
       │ Saved Product Entity
       ▼
┌─────────────────────────────────────────────┐
│         Response Flow (Upward)               │
│  Repository → Use Case → Controller → API    │
│  Product → Result → Response → JSON          │
└──────┬──────────────────────────────────────┘
       │ JSON Response (201)
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## 🔌 Dependency Injection

```
┌─────────────────────────────────────────────┐
│              di.ts (DI Container)            │
│                                              │
│  Creates & wires all dependencies:          │
│                                              │
│  1. PrismaProductRepository(prisma)         │
│         │                                    │
│         ├─► 2. CreateProductUseCase(repo)   │
│                     │                        │
│                     ├─► 3. ProductController(useCase)
│                               │              │
│                               ├─► 4. ProductAPI(controller)
│                                         │    │
│                                         ▼    │
│                                    Router    │
└──────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│            app.ts (Main App)                  │
│  app.use('/api/admin', createAdminModule())  │
└──────────────────────────────────────────────┘
```

## 📦 Module Components

```
admin/
│
├── entities/                    [Domain Layer]
│   └── product/
│       └── product.entity.ts    ← Pure business logic
│
├── applications/                [Application Layer]
│   ├── dto/                     ← Data contracts
│   │   └── command/
│   │       └── create-product.command.ts
│   │
│   ├── ports/                   ← Interfaces (Hexagonal)
│   │   ├── input/               ← Use case interfaces
│   │   │   └── create-product.usecase.ts
│   │   └── output/              ← Repository interfaces
│   │       └── product.repository.ts
│   │
│   ├── usecases/                ← Business logic
│   │   └── create-product.usecase.ts
│   │
│   └── errors/                  ← Domain exceptions
│       └── product.errors.ts
│
├── interface-adapter/           [Interface Adapter Layer]
│   └── controller/
│       └── product.controller.ts ← Orchestration
│
├── infrastructure/              [Infrastructure Layer]
│   ├── api/
│   │   └── product.api.ts      ← HTTP routing
│   └── repositories/
│       └── prisma-product.repository.ts ← DB access
│
└── di.ts                        ← Dependency wiring
```

## 🎯 Port & Adapter Pattern

```
┌──────────────────────────────────────────────┐
│         Application Core (Ports)              │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │     ICreateProductUseCase           │    │
│  │     (Input Port)                    │    │
│  └─────────────────────────────────────┘    │
│                    ▲                         │
│                    │                         │
│  ┌─────────────────┴───────────────────┐    │
│  │    CreateProductUseCase             │    │
│  │    (Application Core)               │    │
│  └─────────────────┬───────────────────┘    │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────────┐    │
│  │     IProductRepository              │    │
│  │     (Output Port)                   │    │
│  └─────────────────────────────────────┘    │
│                                               │
└──────────────────────────────────────────────┘
         ▲                           │
         │                           ▼
┌────────┴─────────┐    ┌────────────────────────┐
│  Input Adapter   │    │   Output Adapter       │
│  (Controller)    │    │  (PrismaRepository)    │
│                  │    │                        │
│  ProductAPI      │    │  Database Access       │
│  HTTP Handling   │    │  via Prisma ORM        │
└──────────────────┘    └────────────────────────┘
```

## 🔐 Error Handling Flow

```
                Application Layer
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
ProductAlready  InvalidProduct   Generic
ExistsError     DataError        Error
        │              │              │
        └──────────────┴──────────────┘
                       │
                       ▼
            ProductAPI (catches)
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    409 Conflict   400 Bad Request  500 Server Error
        │              │              │
        └──────────────┴──────────────┘
                       │
                       ▼
              JSON Error Response
```

## 💾 Database Transaction

```
┌─────────────────────────────────────────────┐
│        Prisma Transaction Scope              │
│                                              │
│  BEGIN TRANSACTION                           │
│    │                                         │
│    ├─► 1. INSERT INTO products              │
│    │        (name, description, basePrice)  │
│    │                                         │
│    ├─► 2. INSERT INTO product_variants      │
│    │        (productId, sku, price, stock)  │
│    │        [Multiple records]              │
│    │                                         │
│    ├─► 3. INSERT INTO product_images        │
│    │        (productId, variantId, url)     │
│    │        [Multiple records]              │
│    │                                         │
│    ├─► 4. INSERT INTO product_categories    │
│    │        (productId, categoryId)         │
│    │        [Multiple records]              │
│    │                                         │
│    └─► 5. INSERT INTO product_tags          │
│             (productId, tagId)              │
│             [Multiple records]              │
│                                              │
│  COMMIT                                      │
│                                              │
│  If any step fails → ROLLBACK ALL           │
└─────────────────────────────────────────────┘
```

## 🔍 Validation Layers

```
Layer 1: API Layer (ProductAPI)
├─ Request structure validation
├─ Required fields check
├─ Data type validation
└─ Array validation

Layer 2: Use Case Layer (CreateProductUseCase)
├─ Business rule validation
├─ SKU uniqueness check
├─ Duplicate SKU in request check
└─ Price & stock validation

Layer 3: Domain Layer (Product/ProductVariant)
├─ Entity invariants
├─ Value constraints
└─ Business logic rules
```

## 📊 Response Format

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "productId": "uuid-here",
    "message": "Product created successfully"
  }
}
```

---

**Legend:**

- `│` - Dependency flow
- `▼` - Data flow direction
- `←` - Layer responsibility
- `→` - Implementation
