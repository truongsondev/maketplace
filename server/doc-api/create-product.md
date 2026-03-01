# Create Product API

## Endpoint

```
POST /api/admin/products
```

## Description

Create a new product with variants, images, categories, and tags.

## Authentication

Requires authentication token in the request headers.

## Request Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

## Request Body

```json
{
  "name": "Product Name",
  "description": "Product description (optional)",
  "basePrice": 100.0,
  "variants": [
    {
      "sku": "PROD-001-RED-M",
      "attributes": {
        "color": "Red",
        "size": "M"
      },
      "price": 120.0,
      "stockAvailable": 50,
      "minStock": 5
    },
    {
      "sku": "PROD-001-BLUE-L",
      "attributes": {
        "color": "Blue",
        "size": "L"
      },
      "price": 130.0,
      "stockAvailable": 30,
      "minStock": 5
    }
  ],
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "altText": "Product main image",
      "sortOrder": 0,
      "isPrimary": true
    },
    {
      "url": "https://example.com/image2.jpg",
      "altText": "Product side view",
      "sortOrder": 1,
      "isPrimary": false,
      "variantId": "PROD-001-RED-M"
    }
  ],
  "categoryIds": ["category-uuid-1", "category-uuid-2"],
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
```

## Request Body Parameters

### Required Fields

| Field       | Type   | Description                                     |
| ----------- | ------ | ----------------------------------------------- |
| `name`      | string | Product name (non-empty)                        |
| `basePrice` | number | Base price of the product (>= 0)                |
| `variants`  | array  | Array of product variants (at least 1 required) |

### Variant Object (Required in variants array)

| Field            | Type   | Description                                    |
| ---------------- | ------ | ---------------------------------------------- |
| `sku`            | string | Unique SKU identifier (non-empty)              |
| `attributes`     | object | Variant attributes (e.g., color, size)         |
| `price`          | number | Variant price (>= 0)                           |
| `stockAvailable` | number | Available stock quantity (>= 0)                |
| `minStock`       | number | Minimum stock threshold (optional, default: 5) |

### Optional Fields

| Field         | Type   | Description             |
| ------------- | ------ | ----------------------- |
| `description` | string | Product description     |
| `images`      | array  | Array of product images |
| `categoryIds` | array  | Array of category UUIDs |
| `tagIds`      | array  | Array of tag UUIDs      |

### Image Object (Optional in images array)

| Field       | Type    | Description                                         |
| ----------- | ------- | --------------------------------------------------- |
| `url`       | string  | Image URL (required if images array provided)       |
| `altText`   | string  | Alternative text for the image                      |
| `sortOrder` | number  | Display order (default: 0)                          |
| `isPrimary` | boolean | Whether this is the primary image (default: false)  |
| `variantId` | string  | SKU of the variant this image belongs to (optional) |

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "productId": "uuid-of-created-product",
    "message": "Product created successfully"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "message": "Product name must be a non-empty string",
  "error": {
    "code": "BAD_REQUEST",
    "details": null
  }
}
```

#### 409 Conflict - Duplicate SKU

```json
{
  "success": false,
  "message": "Product with SKU \"PROD-001\" already exists",
  "error": {
    "code": "CONFLICT",
    "details": null
  }
}
```

#### 401 Unauthorized - Missing/Invalid Token

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": {
    "code": "UNAUTHORIZED",
    "details": null
  }
}
```

## Validation Rules

1. **Product Name**: Must be a non-empty string
2. **Base Price**: Must be a non-negative number
3. **Variants**:
   - At least one variant is required
   - Each variant must have a unique SKU
   - SKU must be non-empty string
   - Price must be non-negative
   - Stock must be non-negative
   - Attributes must be an object
4. **Images** (if provided):
   - URL must be a non-empty string
   - variantId must match an existing variant SKU
5. **Category IDs** (if provided): Must be an array of strings
6. **Tag IDs** (if provided): Must be an array of strings

## Example Requests

### Minimal Request (Required Fields Only)

```bash
curl -X POST http://localhost:8080/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Basic T-Shirt",
    "basePrice": 29.99,
    "variants": [
      {
        "sku": "TSHIRT-001-M",
        "attributes": {"size": "M"},
        "price": 29.99,
        "stockAvailable": 100
      }
    ]
  }'
```

### Complete Request (All Fields)

```bash
curl -X POST http://localhost:8080/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Premium Cotton T-Shirt",
    "description": "Comfortable premium cotton t-shirt with modern fit",
    "basePrice": 39.99,
    "variants": [
      {
        "sku": "TSHIRT-PREM-001-RED-M",
        "attributes": {"color": "Red", "size": "M"},
        "price": 39.99,
        "stockAvailable": 50,
        "minStock": 10
      },
      {
        "sku": "TSHIRT-PREM-001-RED-L",
        "attributes": {"color": "Red", "size": "L"},
        "price": 39.99,
        "stockAvailable": 45,
        "minStock": 10
      },
      {
        "sku": "TSHIRT-PREM-001-BLUE-M",
        "attributes": {"color": "Blue", "size": "M"},
        "price": 39.99,
        "stockAvailable": 40,
        "minStock": 10
      }
    ],
    "images": [
      {
        "url": "https://cdn.example.com/tshirt-main.jpg",
        "altText": "Premium T-Shirt Main View",
        "sortOrder": 0,
        "isPrimary": true
      },
      {
        "url": "https://cdn.example.com/tshirt-red.jpg",
        "altText": "Red Color Variant",
        "sortOrder": 1,
        "isPrimary": false,
        "variantId": "TSHIRT-PREM-001-RED-M"
      },
      {
        "url": "https://cdn.example.com/tshirt-blue.jpg",
        "altText": "Blue Color Variant",
        "sortOrder": 2,
        "isPrimary": false,
        "variantId": "TSHIRT-PREM-001-BLUE-M"
      }
    ],
    "categoryIds": ["cat-clothing-uuid", "cat-tshirts-uuid"],
    "tagIds": ["tag-new-arrival-uuid", "tag-premium-uuid"]
  }'
```

## Business Logic

1. **Product Creation**: Product is created with all provided information
2. **Variant Management**: Each variant is stored separately with its own inventory
3. **Image Association**: Images can be associated with the product or specific variants
4. **Category & Tag Linking**: Products are automatically linked to specified categories and tags
5. **Transaction Safety**: All operations are performed in a database transaction to ensure data consistency
6. **SKU Uniqueness**: System checks for duplicate SKUs before creating the product

## Architecture

This endpoint follows Clean Architecture principles:

- **Entity Layer**: Product and ProductVariant domain entities with business logic
- **Use Case Layer**: CreateProductUseCase containing application-specific business rules
- **Interface Adapter Layer**: ProductController and DTOs for data transformation
- **Infrastructure Layer**: PrismaProductRepository for database operations and ProductAPI for HTTP handling

## Error Handling

The API uses consistent error handling with:

- Custom error types (ProductAlreadyExistsError, InvalidProductDataError)
- HTTP error codes (400, 401, 409, 500)
- Descriptive error messages
- Structured error responses

## Database Schema

The endpoint creates records in the following tables:

- `products` - Main product information
- `product_variants` - Product variants with SKU and inventory
- `product_images` - Product images
- `product_categories` - Product-category relationships
- `product_tags` - Product-tag relationships
