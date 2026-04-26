# Sequence - Them Variant Vao Gio Hang (POST /api/cart/items)

## 1. Pham vi va module

- Chuc nang: Them variant vao gio hang.
- Module backend: `server/src/module/cart`.
- Entry route: `POST /api/cart/items` (router cart).
- Auth: duoc bao ve boi auth middleware tai cap app (`/api/cart`).

## 2. Database lien quan (schema.prisma)

- `Cart`: moi user co 1 cart (`userId` unique).
- `CartItem`: luu item theo bo ba (`cartId`, `productId`, `variantId`) voi unique constraint.
- `ProductVariant`: nguon gia va ton kho (`stockOnHand`, `stockReserved`).
- `Product`: dung de xac thuc product cha chua bi xoa mem (`isDeleted`).
- `ProductImage`: anh variant uu tien, fallback anh product (`variantId = null`).

## 3. Sequence (theo luong code hien tai) - PlantUML

```plantuml
@startuml
autonumber

actor Buyer as U
participant Client as FE
participant "Express App" as APP
participant "Auth Middleware" as AUTH
participant CartAPI as API
participant CartController as CTL
participant AddToCartUseCase as UC
participant PrismaCartRepository as CART
participant PrismaVariantRepository as VAR
participant PrismaProductImageRepository as IMG
database "MySQL (Prisma)" as DB

U -> FE: Them variant vao gio (variantId, quantity)
FE -> APP: POST /api/cart/items
APP -> AUTH: Verify access token + session

alt Unauthorized
  AUTH --> FE: 401 Unauthorized
else Authorized
  AUTH -> API: Forward request (co userId)
  API -> API: Validate required fields + types

  alt variantId/quantity khong hop le
    API --> FE: 400 Bad Request
  else Payload hop le
    API -> CTL: addToCart(userId, command)
    CTL -> UC: execute(userId, command)

    UC -> UC: validateCommand(variantId, quantity)
    alt quantity <= 0 hoac variantId rong
      UC --> API: Domain error
      API --> FE: 400
    else Command hop le
      UC -> VAR: findByIdWithProduct(variantId)
      VAR -> DB: SELECT variant + product
      DB --> VAR: variantWithProduct/null
      VAR --> UC: variantWithProduct/null

      alt Variant/Product khong hop le (not found/deleted)
        UC --> API: VariantNotFound/ProductNotFound
        API --> FE: 404
      else Variant/Product hop le
        UC -> CART: findByUserId(userId)
        CART -> DB: SELECT cart + items
        DB --> CART: cart/null
        CART --> UC: cart/null

        alt Chua co cart
          UC -> CART: create(userId)
          CART -> DB: INSERT cart
          DB --> CART: cart
          CART --> UC: cart moi
        end

        UC -> CART: findItem(cartId, productId, variantId)
        CART -> DB: SELECT cart_item
        DB --> CART: existingItem/null
        CART --> UC: existingItem/null

        UC -> UC: tinh newQuantity va availableStock = stockOnHand - stockReserved

        alt Het ton kho
          UC --> API: InsufficientStockError
          API --> FE: 409 Conflict
        else Vuot max 10 moi variant
          UC --> API: ExceedsMaxQuantityError
          API --> FE: 409 Conflict
        else Dat rule
          alt Item da ton tai
            UC -> CART: updateItemQuantity(itemId, newQuantity)
            CART -> DB: UPDATE cart_items
            DB --> CART: ok
          else Item chua ton tai
            UC -> CART: addItem(cartId, productId, variantId, quantity)
            CART -> DB: INSERT cart_items
            DB --> CART: ok
          end

          UC -> VAR: reserveStock(variantId, quantity)
          VAR -> DB: UPDATE product_variants.stockReserved += quantity
          DB --> VAR: ok

          UC -> CART: getCartDetail(userId)
          CART -> DB: SELECT cart + items + variant + product
          DB --> CART: updatedCart
          CART --> UC: updatedCart

          loop Moi cart item
            UC -> IMG: findImageForVariant(variantId, productId)
            IMG -> DB: SELECT product_images theo variantId (primary, sort)
            alt Co anh variant
              DB --> IMG: variant image
            else Khong co anh variant
              IMG -> DB: SELECT product_images theo productId, variantId = null
              DB --> IMG: product image/null
            end
            IMG --> UC: image/null
          end

          UC --> CTL: CartDetailResult
          CTL --> API: CartDetailResult
          API --> FE: 200 Success + cart detail
        end
      end
    end
  end
end

@enduml
```

## 4. Class diagram (rut gon cho Add to Cart) - PlantUML

```plantuml
@startuml

class CartAPI {
  +POST /items
  +addToCart(req, res)
}

class CartController {
  +addToCart(userId, command)
}

class AddToCartUseCase {
  -cartRepository: ICartRepository
  -variantRepository: IVariantRepository
  -productImageRepository: IProductImageRepository
  +execute(userId, command): CartDetailResult
  -validateCommand(command)
}

interface ICartRepository {
  +findByUserId(userId)
  +create(userId)
  +findItem(cartId, productId, variantId)
  +addItem(data)
  +updateItemQuantity(itemId, quantity)
  +getCartDetail(userId)
}

interface IVariantRepository {
  +findByIdWithProduct(variantId)
  +reserveStock(variantId, quantity)
  +releaseStock(variantId, quantity)
}

interface IProductImageRepository {
  +findImageForVariant(variantId, productId)
}

class Cart {
  +id
  +userId
  +items[]
  +totalItems
  +totalQuantity
  +totalAmount
}

class CartItem {
  +id
  +productId
  +variantId
  +quantity
  +unitPrice
  +subtotal
}

class ProductVariant {
  +id
  +productId
  +sku
  +stockOnHand
  +stockReserved
  +isDeleted
}

class ProductImage {
  +id
  +productId
  +variantId
  +url
  +isPrimary
  +sortOrder
}

CartAPI --> CartController
CartController --> AddToCartUseCase
AddToCartUseCase --> ICartRepository
AddToCartUseCase --> IVariantRepository
AddToCartUseCase --> IProductImageRepository
ICartRepository --> Cart
Cart --> CartItem
IVariantRepository --> ProductVariant
IProductImageRepository --> ProductImage

@enduml
```

## 5. Ghi chu business

- Rule variant-first da duoc enforce trong use case va API (`variantId` bat buoc).
- Max quantity hien tai la 10 item/variant.
- Luong hien tai chua bao transaction bao quanh cap nhat cart item + reserve stock.
- Chuc nang nay chua phat su kien RabbitMQ; dang la luong dong bo trong cart module.
