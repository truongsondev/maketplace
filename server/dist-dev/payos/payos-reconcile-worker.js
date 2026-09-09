var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/payos-reconcile-worker.ts
import dotenv2 from "dotenv";

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "mysql",
  "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\n// Standard JS Prisma Client runtime (required for running standalone Node scripts in containers)\ngenerator client_js {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "mysql"\n}\n\n// ============================================================================\n// ENUMS\n// ============================================================================\n\nenum UserStatus {\n  ACTIVE\n  SUSPENDED\n  BANNED\n}\n\nenum OAuthProvider {\n  GOOGLE\n  FACEBOOK\n  APPLE\n}\n\nenum OrderStatus {\n  PENDING\n  CONFIRMED\n  PAID\n  PACKING\n  AWAITING_PICKUP\n  SHIPPED\n  DELIVERING\n  DELIVERY_FAILED\n  LOST\n  RETURN_TO_STORE\n  DELIVERED\n  COMPLETED\n  CANCELLED\n  RETURNED\n}\n\nenum PhysicalSaleStatus {\n  COMPLETED\n  CANCELLED\n}\n\nenum VoucherScopeType {\n  ALL_PRODUCTS\n  INCLUDE_CATEGORIES\n  INCLUDE_PRODUCTS\n  MEMBER_TIERS\n}\n\nenum VoucherMinAmountBasis {\n  ELIGIBLE_SUBTOTAL\n  CART_SUBTOTAL\n}\n\nenum PaymentStatus {\n  PENDING\n  /// New (spec): payment succeeded\n  PAID\n  /// Legacy (kept for backward compatibility; treat as PAID in code)\n  SUCCESS\n  FAILED\n  /// New (spec): payment link expired\n  EXPIRED\n  REFUNDED\n}\n\nenum PaymentTransactionStatus {\n  PENDING\n  PAID\n  FAILED\n  /// New (spec): payment link expired\n  EXPIRED\n}\n\nenum InventoryAction {\n  IMPORT\n  EXPORT\n  RETURN\n  ADJUSTMENT\n  RESERVE\n  RELEASE\n  SALE\n}\n\nenum ActorType {\n  ADMIN\n  USER\n  SYSTEM\n}\n\nenum ReturnStatus {\n  RT_REQUESTED\n  RT_APPROVED\n  RT_SHIPPING\n  RT_COMPLETED\n  RT_REJECTED\n}\n\nenum SalesChannel {\n  ONLINE\n  PHYSICAL_STORE\n  INTERNAL\n}\n\nenum LoyaltyTransactionType {\n  EARN\n  REDEEM\n  REVERSE\n  ADJUST\n  EXPIRE\n}\n\nenum ReturnFlowStatus {\n  /// Buyer yeu cau tra hang (cho duyet)\n  REQUESTED\n  /// Admin da duyet yeu cau tra hang\n  APPROVED\n  /// GHN dang den lay hang tai dia chi khach\n  PICKING\n  /// Hang dang duoc gui tra ve shop\n  SHIPPING\n  /// Shop da nhan hang tra (ket thuc)\n  COMPLETED\n  /// Yeu cau tra hang bi tu choi (ket thuc)\n  REJECTED\n}\n\nenum ReturnRequestType {\n  EXCHANGE\n  RETURN_REFUND\n}\n\nenum RefundType {\n  CANCEL_REFUND\n  RETURN_REFUND\n  LOST_SHIPMENT_REFUND\n}\n\nenum RefundStatus {\n  PENDING\n  SUCCESS\n  FAILED\n  RETRYING\n}\n\nenum CancelReason {\n  NO_LONGER_NEEDED\n  BUY_OTHER_ITEM\n  FOUND_CHEAPER\n  OTHER\n}\n\nenum CancelRequestStatus {\n  REQUESTED\n  APPROVED\n  REJECTED\n  COMPLETED\n}\n\nenum DiscountType {\n  PERCENTAGE // Gi\u1EA3m theo %\n  FIXED_AMOUNT // Gi\u1EA3m s\u1ED1 ti\u1EC1n c\u1ED1 \u0111\u1ECBnh\n}\n\nenum PromotionType {\n  PERCENTAGE\n  FIXED_AMOUNT\n  SALE_PRICE\n  COMBO_FIXED\n  BUY_X_GET_Y\n}\n\nenum PromotionStatus {\n  DRAFT\n  SCHEDULED\n  ACTIVE\n  PAUSED\n  ENDED\n}\n\nenum PromotionCampaignType {\n  FLASH_SALE\n  HOLIDAY\n  CUSTOMER_APPRECIATION\n  SEASONAL\n  CUSTOM\n}\n\nenum PromotionScopeType {\n  ALL_PRODUCTS\n  INCLUDE_CATEGORIES\n  INCLUDE_PRODUCTS\n  MEMBER_TIERS\n}\n\n// ============================================================================\n// LONG-TERM CATALOG (ProductType + Attribute System)\n// (Additive: designed to coexist with current Product/ProductVariant JSON attrs)\n// ============================================================================\n\nenum ProductStatus {\n  DRAFT\n  ACTIVE\n  ARCHIVED\n}\n\nenum VariantStatus {\n  ACTIVE\n  INACTIVE\n}\n\nenum AttributeScope {\n  PRODUCT\n  VARIANT\n}\n\nenum AttributeDataType {\n  TEXT\n  NUMBER\n  BOOLEAN\n  DATE\n  SELECT\n  MULTI_SELECT\n}\n\nenum RecommendationEventType {\n  VIEW_PRODUCT\n  ADD_TO_CART\n  REMOVE_FROM_CART\n  PURCHASE\n  SEARCH_QUERY\n  FAVORITE_PRODUCT\n  RECOMMENDATION_IMPRESSION\n  RECOMMENDATION_CLICK\n}\n\nenum RecommendationModelKind {\n  TRENDING\n  TOP_VIEWED\n  TOP_PURCHASED\n  ITEM_SIMILARITY\n  PERSONALIZED\n  HYBRID\n  SESSION_BASED\n}\n\nenum ChatMessageRole {\n  USER\n  ASSISTANT\n  SYSTEM\n}\n\nenum ChatSessionStatus {\n  OPEN\n  QUALIFIED\n  CONTACT_CAPTURED\n  ESCALATED\n  CLOSED\n}\n\nenum VirtualTryOnStatus {\n  PENDING\n  PROCESSING\n  SUCCEEDED\n  FAILED\n  CANCELED\n  TIMEOUT\n}\n\n// ============================================================================\n// AUTHENTICATION\n// ============================================================================\n\n/// B\u1EA3ng ng\u01B0\u1EDDi d\xF9ng g\u1ED1c - l\u01B0u th\xF4ng tin x\xE1c th\u1EF1c c\u1ED1t l\xF5i\nmodel User {\n  id                   String     @id @default(uuid()) @db.VarChar(36)\n  email                String?    @unique @db.VarChar(255)\n  phone                String?    @unique @db.VarChar(20)\n  passwordHash         String?    @map("password_hash") @db.VarChar(255)\n  emailVerified        Boolean    @default(false) @map("email_verified")\n  status               UserStatus @default(ACTIVE)\n  lastLogin            DateTime?  @map("last_login")\n  age                  Int?\n  birthday             DateTime?  @db.Date\n  heightCm             Decimal?   @map("height_cm") @db.Decimal(5, 2)\n  weightKg             Decimal?   @map("weight_kg") @db.Decimal(5, 2)\n  bodyProfileUpdatedAt DateTime?  @map("body_profile_updated_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  // Relations\n  addresses               UserAddress[]\n  refreshTokens           RefreshToken[]\n  oauthAccounts           OAuthAccount[]\n  emailVerificationTokens EmailVerificationToken[]\n  passwordResetTokens     PasswordResetToken[]\n  userRoles               UserRole[]\n  cart                    Cart?\n  orders                  Order[]\n  notifications           Notification[]\n  activityLogs            UserActivityLog[]\n  wishlist                Wishlist[]\n  reviews                 Review[]\n  recommendationEvents    RecommendationEvent[]\n  recommendationCaches    RecommendationCache[]\n  userEmbeddings          UserEmbedding[]\n  chatSessions            ChatSession[]\n  virtualTryOnRequests    VirtualTryOnRequest[]\n  loyaltyAccount          LoyaltyAccount?\n  birthdayVoucherGrants   BirthdayVoucherGrant[]\n\n  @@map("users")\n}\n\n/// Qu\u1EA3n l\xFD phi\xEAn \u0111\u0103ng nh\u1EADp v\u1EDBi JWT\nmodel RefreshToken {\n  id         String   @id @default(uuid()) @db.VarChar(36)\n  userId     String   @map("user_id") @db.VarChar(36)\n  token      String   @unique @db.VarChar(500)\n  deviceInfo String?  @map("device_info") @db.VarChar(500)\n  expiresAt  DateTime @map("expires_at")\n  revoked    Boolean  @default(false)\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("refresh_tokens")\n}\n\n/// Email verification tokens for registration flow\nmodel EmailVerificationToken {\n  id        String   @id @default(uuid()) @db.VarChar(36)\n  userId    String   @map("user_id") @db.VarChar(36)\n  tokenHash String   @unique @map("token_hash") @db.VarChar(64)\n  expiresAt DateTime @map("expires_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("email_verification_tokens")\n}\n\n/// Password reset tokens for forgot-password flow\nmodel PasswordResetToken {\n  id        String   @id @default(uuid()) @db.VarChar(36)\n  userId    String   @map("user_id") @db.VarChar(36)\n  tokenHash String   @unique @map("token_hash") @db.VarChar(64)\n  expiresAt DateTime @map("expires_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("password_reset_tokens")\n}\n\n/// Li\xEAn k\u1EBFt \u0111\u0103ng nh\u1EADp OAuth (Google, Facebook, Apple)\nmodel OAuthAccount {\n  id             String        @id @default(uuid()) @db.VarChar(36)\n  userId         String        @map("user_id") @db.VarChar(36)\n  provider       OAuthProvider\n  providerUserId String        @map("provider_user_id") @db.VarChar(500)\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([provider, providerUserId])\n  @@index([userId])\n  @@map("oauth_accounts")\n}\n\n// ============================================================================\n// AUTHORIZATION (RBAC)\n// ============================================================================\n\n/// \u0110\u1ECBnh ngh\u0129a c\xE1c vai tr\xF2 trong h\u1EC7 th\u1ED1ng\nmodel Role {\n  id   Int    @id @default(autoincrement())\n  code String @unique @db.VarChar(50) // BUYER, SELLER, ADMIN\n  name String @db.VarChar(100)\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  userRoles UserRole[]\n\n  @@map("roles")\n}\n\n/// B\u1EA3ng trung gian - g\xE1n vai tr\xF2 cho user (n-n)\nmodel UserRole {\n  userId String @map("user_id") @db.VarChar(36)\n  roleId Int    @map("role_id")\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)\n\n  @@id([userId, roleId])\n  @@index([roleId])\n  @@map("user_roles")\n}\n\n// ============================================================================\n// PROFILE\n// ============================================================================\n\n/// \u0110\u1ECBa ch\u1EC9 ng\u01B0\u1EDDi d\xF9ng - qu\u1EA3n l\xFD nhi\u1EC1u \u0111\u1ECBa ch\u1EC9 giao h\xE0ng\nmodel UserAddress {\n  id            String  @id @default(uuid()) @db.VarChar(36)\n  userId        String  @map("user_id") @db.VarChar(36)\n  recipient     String  @db.VarChar(255)\n  phone         String  @db.VarChar(20)\n  addressLine   String  @map("address_line") @db.Text\n  ward          String  @db.VarChar(100)\n  district      String  @db.VarChar(100)\n  city          String  @db.VarChar(100)\n  isDefault     Boolean @default(false) @map("is_default")\n  ghnProvinceId Int?    @map("ghn_province_id")\n  ghnDistrictId Int?    @map("ghn_district_id")\n  ghnWardCode   String? @map("ghn_ward_code") @db.VarChar(20)\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("user_addresses")\n}\n\n// ============================================================================\n// PRODUCTS (Soft delete + variants + images + categories)\n// ============================================================================\n\n/// S\u1EA3n ph\u1EA9m - th\xF4ng tin c\u01A1 b\u1EA3n; t\u1ED3n kho & gi\xE1 th\u1EF1c t\u1EBF n\u1EB1m \u1EDF ProductVariant\nmodel Product {\n  id            String        @id @default(uuid()) @db.VarChar(36)\n  /// Lo\u1EA1i s\u1EA3n ph\u1EA9m (\xE1o/qu\u1EA7n/ph\u1EE5 ki\u1EC7n...). Nullable \u0111\u1EC3 migrate d\u1EA7n.\n  productTypeId String?       @map("product_type_id") @db.VarChar(36)\n  name          String        @db.VarChar(255)\n  description   String?       @db.Text\n  /// Gi\xE1 hi\u1EC3n th\u1ECB / kh\u1EDFi \u0111i\u1EC3m; gi\xE1 b\xE1n th\u1EF1c t\u1EBF l\u1EA5y t\u1EEB ProductVariant.price\n  basePrice     Decimal       @map("base_price") @db.Decimal(10, 2)\n  /// Tr\u1EA1ng th\xE1i catalog (\u0111i \u0111\u01B0\u1EDDng d\xE0i). Migrate d\u1EA7n, m\u1EB7c \u0111\u1ECBnh ACTIVE.\n  status        ProductStatus @default(ACTIVE)\n  isSale        Boolean       @default(false) @map("is_sale")\n  isDeleted     Boolean       @default(false) @map("is_deleted")\n  /// Soft-delete chu\u1EA9n (nullable \u0111\u1EC3 migrate d\u1EA7n).\n  deletedAt     DateTime?     @map("deleted_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  // Relations\n  productType          ProductType?               @relation(fields: [productTypeId], references: [id], onDelete: SetNull)\n  variants             ProductVariant[]\n  images               ProductImage[]\n  categories           ProductCategory[]\n  tags                 ProductTag[]\n  cartItems            CartItem[]\n  orderItems           OrderItem[]\n  wishlist             Wishlist[]\n  reviews              Review[]\n  priceHistory         ProductPriceHistory[]\n  recommendationEvents RecommendationEvent[]\n  similaritySources    ProductSimilarity[]        @relation("ProductSimilaritySource")\n  similarityTargets    ProductSimilarity[]        @relation("ProductSimilarityTarget")\n  recommendationCaches RecommendationCache[]\n  productEmbeddings    ProductEmbedding[]\n  virtualTryOnRequests VirtualTryOnRequest[]\n  sizeChartRules       SizeChartRule[]\n  discountIncludes     DiscountIncludedProduct[]\n  discountExcludes     DiscountExcludedProduct[]\n  promotionIncludes    PromotionIncludedProduct[]\n\n  attributeValues ProductAttributeValue[]\n\n  @@index([createdAt])\n  @@index([productTypeId, status])\n  @@index([deletedAt])\n  @@fulltext([name])\n  @@map("products")\n}\n\n// ============================================================================\n// PRODUCT VARIANTS & IMAGES\n// ============================================================================\n\n/// Bi\u1EBFn th\u1EC3 s\u1EA3n ph\u1EA9m - qu\u1EA3n l\xFD SKU, size/m\xE0u, t\u1ED3n kho\nmodel ProductVariant {\n  id             String        @id @default(uuid()) @db.VarChar(36)\n  productId      String        @map("product_id") @db.VarChar(36)\n  sku            String        @unique @db.VarChar(100)\n  /// Canonical key cho t\u1ED5 h\u1EE3p bi\u1EBFn th\u1EC3 (vd: color=red|size=m). Nullable \u0111\u1EC3 backfill d\u1EA7n.\n  optionKey      String?       @map("option_key") @db.VarChar(500)\n  status         VariantStatus @default(ACTIVE)\n  isDefault      Boolean       @default(false) @map("is_default")\n  /// Thu\u1ED9c t\xEDnh bi\u1EBFn th\u1EC3: {"color": "\u0111\u1ECF", "size": "M"}\n  attributes     Json          @default("{}")\n  price          Decimal       @db.Decimal(10, 2)\n  stockAvailable Int           @default(0) @map("stock_available")\n  /// Chu\u1EA9n d\xE0i h\u1EA1n: stockOnHand (gi\u1EEF song song \u0111\u1EC3 migrate)\n  stockOnHand    Int           @default(0) @map("stock_on_hand")\n  stockReserved  Int           @default(0) @map("stock_reserved")\n  minStock       Int           @default(5) @map("min_stock")\n  isDeleted      Boolean       @default(false) @map("is_deleted")\n  deletedAt      DateTime?     @map("deleted_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  // Relations\n  product           Product               @relation(fields: [productId], references: [id], onDelete: Cascade)\n  cartItems         CartItem[]\n  orderItems        OrderItem[]\n  images            ProductImage[]\n  inventoryLogs     InventoryLog[]\n  priceHistory      ProductPriceHistory[]\n  physicalSaleItems PhysicalSaleItem[]\n\n  attributeValues VariantAttributeValue[]\n\n  @@unique([productId, optionKey])\n  @@index([productId])\n  @@index([productId, status])\n  @@index([deletedAt])\n  @@map("product_variants")\n}\n\n/// \u1EA2nh s\u1EA3n ph\u1EA9m - \u1EA3nh chung ho\u1EB7c ri\xEAng cho t\u1EEBng variant\nmodel ProductImage {\n  id        String  @id @default(uuid()) @db.VarChar(36)\n  productId String  @map("product_id") @db.VarChar(36)\n  variantId String? @map("variant_id") @db.VarChar(36)\n  url       String  @db.VarChar(1000)\n  altText   String? @map("alt_text") @db.VarChar(255)\n  sortOrder Int     @default(0) @map("sort_order")\n  isPrimary Boolean @default(false) @map("is_primary")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  product Product         @relation(fields: [productId], references: [id], onDelete: Cascade)\n  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)\n\n  @@index([productId])\n  @@map("product_images")\n}\n\n// ============================================================================\n// CATEGORIES & TAGS\n// ============================================================================\n\nmodel Category {\n  id          String  @id @default(uuid()) @db.VarChar(36)\n  name        String  @db.VarChar(255)\n  slug        String  @unique @db.VarChar(255)\n  description String? @db.Text\n  imageUrl    String? @map("image_url") @db.VarChar(1000)\n  sortOrder   Int     @default(0) @map("sort_order")\n\n  parentId String? @map("parent_id") @db.VarChar(36)\n\n  createdAt DateTime  @default(now()) @map("created_at")\n  updatedAt DateTime  @updatedAt @map("updated_at")\n  deletedAt DateTime? @map("deleted_at")\n\n  // Relations\n  parent            Category?                   @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)\n  children          Category[]                  @relation("CategoryHierarchy")\n  products          ProductCategory[]\n  discountIncludes  DiscountIncludedCategory[]\n  discountExcludes  DiscountExcludedCategory[]\n  promotionIncludes PromotionIncludedCategory[]\n\n  @@index([parentId])\n  @@index([deletedAt])\n  @@map("categories")\n}\n\n/// B\u1EA3ng trung gian - s\u1EA3n ph\u1EA9m thu\u1ED9c nhi\u1EC1u danh m\u1EE5c\nmodel ProductCategory {\n  productId  String @map("product_id") @db.VarChar(36)\n  categoryId String @map("category_id") @db.VarChar(36)\n\n  /// Merchandising\n  isPrimary Boolean @default(false) @map("is_primary")\n  sortOrder Int     @default(0) @map("sort_order")\n\n  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)\n  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@id([productId, categoryId])\n  @@index([categoryId, isPrimary, sortOrder])\n  @@map("product_categories")\n}\n\n// ============================================================================\n// PRODUCT TYPE\n// ============================================================================\n\nmodel ProductType {\n  id          String    @id @default(uuid()) @db.VarChar(36)\n  code        String    @unique @db.VarChar(100)\n  name        String    @db.VarChar(255)\n  description String?   @db.Text\n  deletedAt   DateTime? @map("deleted_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  products       Product[]\n  attributes     ProductTypeAttribute[]\n  sizeChartRules SizeChartRule[]\n\n  @@index([deletedAt])\n  @@map("product_types")\n}\n\nmodel SizeChartRule {\n  id            String   @id @default(uuid()) @db.VarChar(36)\n  productId     String?  @map("product_id") @db.VarChar(36)\n  productTypeId String?  @map("product_type_id") @db.VarChar(36)\n  sizeLabel     String   @map("size_label") @db.VarChar(30)\n  minHeightCm   Decimal? @map("min_height_cm") @db.Decimal(5, 2)\n  maxHeightCm   Decimal? @map("max_height_cm") @db.Decimal(5, 2)\n  minWeightKg   Decimal? @map("min_weight_kg") @db.Decimal(5, 2)\n  maxWeightKg   Decimal? @map("max_weight_kg") @db.Decimal(5, 2)\n  fitPreference String   @default("REGULAR") @map("fit_preference") @db.VarChar(20)\n  priority      Int      @default(0)\n  isActive      Boolean  @default(true) @map("is_active")\n  createdAt     DateTime @default(now()) @map("created_at")\n  updatedAt     DateTime @updatedAt @map("updated_at")\n\n  product     Product?     @relation(fields: [productId], references: [id], onDelete: Cascade)\n  productType ProductType? @relation(fields: [productTypeId], references: [id], onDelete: Cascade)\n\n  @@index([productId, isActive])\n  @@index([productTypeId, isActive])\n  @@map("size_chart_rules")\n}\n\n// ============================================================================\n// ATTRIBUTE DEFINITIONS\n// ============================================================================\n\nmodel AttributeDefinition {\n  id       String            @id @default(uuid()) @db.VarChar(36)\n  code     String            @unique @db.VarChar(100)\n  name     String            @db.VarChar(255)\n  scope    AttributeScope\n  dataType AttributeDataType @map("data_type")\n  unit     String?           @db.VarChar(50)\n\n  deletedAt DateTime? @map("deleted_at")\n  createdAt DateTime  @default(now()) @map("created_at")\n  updatedAt DateTime  @updatedAt @map("updated_at")\n\n  options       AttributeOption[]\n  typeMaps      ProductTypeAttribute[]\n  productValues ProductAttributeValue[]\n  variantValues VariantAttributeValue[]\n\n  @@index([scope, dataType])\n  @@index([deletedAt])\n  @@map("attribute_definitions")\n}\n\nmodel AttributeOption {\n  id          String  @id @default(uuid()) @db.VarChar(36)\n  attributeId String  @map("attribute_id") @db.VarChar(36)\n  value       String  @db.VarChar(100)\n  label       String  @db.VarChar(255)\n  sortOrder   Int     @default(0) @map("sort_order")\n  swatchHex   String? @map("swatch_hex") @db.VarChar(16)\n\n  deletedAt DateTime? @map("deleted_at")\n  createdAt DateTime  @default(now()) @map("created_at")\n  updatedAt DateTime  @updatedAt @map("updated_at")\n\n  attribute AttributeDefinition @relation(fields: [attributeId], references: [id], onDelete: Cascade)\n\n  productValues           ProductAttributeValue[]\n  productMultiSelectJoins ProductAttributeValueOption[]\n  variantValues           VariantAttributeValue[]\n\n  @@unique([attributeId, value])\n  @@index([attributeId, sortOrder])\n  @@index([deletedAt])\n  @@map("attribute_options")\n}\n\nmodel ProductTypeAttribute {\n  productTypeId String @map("product_type_id") @db.VarChar(36)\n  attributeId   String @map("attribute_id") @db.VarChar(36)\n\n  isRequired       Boolean @default(false) @map("is_required")\n  isFilterable     Boolean @default(false) @map("is_filterable")\n  isVariantAxis    Boolean @default(false) @map("is_variant_axis")\n  variantAxisOrder Int?    @map("variant_axis_order")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  productType ProductType         @relation(fields: [productTypeId], references: [id], onDelete: Cascade)\n  attribute   AttributeDefinition @relation(fields: [attributeId], references: [id], onDelete: Cascade)\n\n  @@id([productTypeId, attributeId])\n  @@index([productTypeId, isVariantAxis, variantAxisOrder])\n  @@map("product_type_attributes")\n}\n\n// ============================================================================\n// ATTRIBUTE VALUES (PRODUCT)\n// ============================================================================\n\nmodel ProductAttributeValue {\n  id          String @id @default(uuid()) @db.VarChar(36)\n  productId   String @map("product_id") @db.VarChar(36)\n  attributeId String @map("attribute_id") @db.VarChar(36)\n\n  textValue    String?   @map("text_value") @db.Text\n  numberValue  Decimal?  @map("number_value") @db.Decimal(18, 4)\n  booleanValue Boolean?  @map("boolean_value")\n  dateValue    DateTime? @map("date_value")\n  optionId     String?   @map("option_id") @db.VarChar(36)\n\n  deletedAt DateTime? @map("deleted_at")\n  createdAt DateTime  @default(now()) @map("created_at")\n  updatedAt DateTime  @updatedAt @map("updated_at")\n\n  product   Product             @relation(fields: [productId], references: [id], onDelete: Cascade)\n  attribute AttributeDefinition @relation(fields: [attributeId], references: [id], onDelete: Cascade)\n  option    AttributeOption?    @relation(fields: [optionId], references: [id], onDelete: SetNull)\n\n  multiSelectOptions ProductAttributeValueOption[]\n\n  @@unique([productId, attributeId])\n  @@index([attributeId, optionId])\n  @@index([deletedAt])\n  @@map("product_attribute_values")\n}\n\nmodel ProductAttributeValueOption {\n  productAttributeValueId String @map("product_attribute_value_id") @db.VarChar(36)\n  optionId                String @map("option_id") @db.VarChar(36)\n\n  value  ProductAttributeValue @relation(fields: [productAttributeValueId], references: [id], onDelete: Cascade)\n  option AttributeOption       @relation(fields: [optionId], references: [id], onDelete: Cascade)\n\n  @@id([productAttributeValueId, optionId])\n  @@index([optionId])\n  @@map("product_attribute_value_options")\n}\n\n// ============================================================================\n// ATTRIBUTE VALUES (VARIANT)\n// ============================================================================\n\nmodel VariantAttributeValue {\n  id          String @id @default(uuid()) @db.VarChar(36)\n  variantId   String @map("variant_id") @db.VarChar(36)\n  attributeId String @map("attribute_id") @db.VarChar(36)\n\n  textValue    String?   @map("text_value") @db.Text\n  numberValue  Decimal?  @map("number_value") @db.Decimal(18, 4)\n  booleanValue Boolean?  @map("boolean_value")\n  dateValue    DateTime? @map("date_value")\n  optionId     String?   @map("option_id") @db.VarChar(36)\n\n  deletedAt DateTime? @map("deleted_at")\n  createdAt DateTime  @default(now()) @map("created_at")\n  updatedAt DateTime  @updatedAt @map("updated_at")\n\n  variant   ProductVariant      @relation(fields: [variantId], references: [id], onDelete: Cascade)\n  attribute AttributeDefinition @relation(fields: [attributeId], references: [id], onDelete: Cascade)\n  option    AttributeOption?    @relation(fields: [optionId], references: [id], onDelete: SetNull)\n\n  @@unique([variantId, attributeId])\n  @@index([attributeId, optionId])\n  @@index([deletedAt])\n  @@map("variant_attribute_values")\n}\n\n/// Tag - nh\xE3n t\u1EF1 do g\u1EAFn v\xE0o s\u1EA3n ph\u1EA9m\nmodel Tag {\n  id   String @id @default(uuid()) @db.VarChar(36)\n  name String @unique @db.VarChar(100)\n  slug String @unique @db.VarChar(100)\n\n  products ProductTag[]\n\n  @@map("tags")\n}\n\n/// B\u1EA3ng trung gian - s\u1EA3n ph\u1EA9m g\u1EAFn nhi\u1EC1u tag\nmodel ProductTag {\n  productId String @map("product_id") @db.VarChar(36)\n  tagId     String @map("tag_id") @db.VarChar(36)\n\n  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)\n  tag     Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)\n\n  @@id([productId, tagId])\n  @@map("product_tags")\n}\n\n// ============================================================================\n// CART\n// ============================================================================\n\n/// Gi\u1ECF h\xE0ng - m\u1ED7i user c\xF3 1 gi\u1ECF h\xE0ng\nmodel Cart {\n  id     String @id @default(uuid()) @db.VarChar(36)\n  userId String @unique @map("user_id") @db.VarChar(36)\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)\n  items CartItem[]\n\n  @@map("carts")\n}\n\n/// Chi ti\u1EBFt gi\u1ECF h\xE0ng\nmodel CartItem {\n  id        String  @id @default(uuid()) @db.VarChar(36)\n  cartId    String  @map("cart_id") @db.VarChar(36)\n  productId String  @map("product_id") @db.VarChar(36)\n  variantId String? @map("variant_id") @db.VarChar(36)\n  quantity  Int\n\n  // Relations\n  cart    Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)\n  product Product         @relation(fields: [productId], references: [id])\n  variant ProductVariant? @relation(fields: [variantId], references: [id])\n\n  /// N\u1EBFu variantId IS NULL, MySQL cho ph\xE9p tr\xF9ng (cartId, productId, NULL) \u2192 app ph\u1EA3i enforce\n  @@unique([cartId, productId, variantId])\n  @@index([productId])\n  @@index([variantId])\n  @@map("cart_items")\n}\n\n// ============================================================================\n// ORDERS\n// ============================================================================\n\n/// \u0110\u01A1n h\xE0ng\nmodel Order {\n  id                String            @id @default(uuid()) @db.VarChar(36)\n  userId            String            @map("user_id") @db.VarChar(36)\n  subtotalPrice     Decimal           @default(0) @map("subtotal_price") @db.Decimal(10, 2)\n  shippingFee       Decimal           @default(0) @map("shipping_fee") @db.Decimal(10, 2)\n  totalPrice        Decimal           @map("total_price") @db.Decimal(10, 2)\n  status            OrderStatus       @default(PENDING)\n  returnStatus      ReturnFlowStatus? @map("return_status")\n  discountId        String?           @map("discount_id") @db.VarChar(36)\n  discountAmount    Decimal?          @map("discount_amount") @db.Decimal(10, 2)\n  itemsSubtotal     Decimal           @default(0) @map("items_subtotal") @db.Decimal(10, 2)\n  productDiscount   Decimal           @default(0) @map("product_discount") @db.Decimal(10, 2)\n  promotionDiscount Decimal           @default(0) @map("promotion_discount") @db.Decimal(10, 2)\n  voucherDiscount   Decimal           @default(0) @map("voucher_discount") @db.Decimal(10, 2)\n  grandTotal        Decimal           @default(0) @map("grand_total") @db.Decimal(10, 2)\n  carrierName       String?           @map("carrier_name") @db.VarChar(120)\n  trackingCode      String?           @map("tracking_code") @db.VarChar(120)\n  deliveryNote      String?           @map("delivery_note") @db.VarChar(500)\n  shippedAt         DateTime?         @map("shipped_at")\n  deliveredAt       DateTime?         @map("delivered_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  // Relations\n  user               User                  @relation(fields: [userId], references: [id])\n  items              OrderItem[]\n  payment            Payment?\n  paymentTransaction PaymentTransaction?\n  refundTransactions RefundTransaction[]\n  cancelRequest      OrderCancelRequest?\n  statusHistory      OrderStatusHistory[]\n  shippingAddress    OrderShippingAddress?\n  discount           Discount?             @relation(fields: [discountId], references: [id])\n  discountUsage      DiscountUsage?\n  promotionUsages    PromotionUsage[]\n  shipment           OrderShipment?\n  returnShipment     ReturnShipment?\n\n  @@index([status])\n  @@index([userId])\n  @@map("orders")\n}\n\n/// Snapshot b\u1EA5t bi\u1EBFn c\u1EE7a \u0111\u1ECBa ch\u1EC9 giao h\xE0ng t\u1EA1i th\u1EDDi \u0111i\u1EC3m t\u1EA1o \u0111\u01A1n.\n/// sourceAddressId ch\u1EC9 d\xF9ng \u0111\u1EC3 truy v\u1EBFt; kh\xF4ng t\u1EA1o FK \u0111\u1EC3 vi\u1EC7c x\xF3a \u0111\u1ECBa ch\u1EC9 h\u1ED3 s\u01A1\n/// kh\xF4ng th\u1EC3 l\xE0m thay \u0111\u1ED5i ho\u1EB7c x\xF3a d\u1EEF li\u1EC7u l\u1ECBch s\u1EED c\u1EE7a \u0111\u01A1n h\xE0ng.\nmodel OrderShippingAddress {\n  id              String   @id @default(uuid()) @db.VarChar(36)\n  orderId         String   @unique @map("order_id") @db.VarChar(36)\n  recipientName   String   @map("recipient_name") @db.VarChar(255)\n  phone           String   @db.VarChar(20)\n  addressLine     String   @map("address_line") @db.Text\n  ward            String   @db.VarChar(100)\n  district        String   @db.VarChar(100)\n  city            String   @db.VarChar(100)\n  sourceAddressId String?  @map("source_address_id") @db.VarChar(36)\n  snapshotSource  String   @default("CHECKOUT") @map("snapshot_source") @db.VarChar(40)\n  ghnProvinceId   Int?     @map("ghn_province_id")\n  ghnDistrictId   Int?     @map("ghn_district_id")\n  ghnWardCode     String?  @map("ghn_ward_code") @db.VarChar(20)\n  createdAt       DateTime @default(now()) @map("created_at")\n\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@index([sourceAddressId])\n  @@map("order_shipping_addresses")\n}\n\nmodel OrderShipment {\n  id                String    @id @default(uuid()) @db.VarChar(36)\n  orderId           String    @unique @map("order_id") @db.VarChar(36)\n  provider          String    @db.VarChar(30)\n  providerOrderCode String    @unique @map("provider_order_code") @db.VarChar(120)\n  providerStatus    String?   @map("provider_status") @db.VarChar(80)\n  serviceId         Int?      @map("service_id")\n  serviceTypeId     Int?      @map("service_type_id")\n  codAmount         Decimal?  @map("cod_amount") @db.Decimal(12, 2)\n  externalFee       Decimal?  @map("external_fee") @db.Decimal(12, 2)\n  rawCreatePayload  Json?     @map("raw_create_payload")\n  rawCreateResponse Json?     @map("raw_create_response")\n  rawLatestWebhook  Json?     @map("raw_latest_webhook")\n  lastWebhookTime   DateTime? @map("last_webhook_time")\n  createdAt         DateTime  @default(now()) @map("created_at")\n  updatedAt         DateTime  @updatedAt @map("updated_at")\n\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@index([provider, providerStatus])\n  @@map("order_shipments")\n}\n\n/// V\u1EADn \u0111\u01A1n GHN \u0111\u1ED9c l\u1EADp \u0111\u1EC3 l\u1EA5y h\xE0ng t\u1EEB kh\xE1ch sau khi \u0111\u01A1n giao \u0111i \u0111\xE3 ho\xE0n t\u1EA5t.\nmodel ReturnShipment {\n  id                String    @id @default(uuid()) @db.VarChar(36)\n  orderId           String    @unique @map("order_id") @db.VarChar(36)\n  provider          String    @db.VarChar(30)\n  providerOrderCode String    @unique @map("provider_order_code") @db.VarChar(120)\n  providerStatus    String?   @map("provider_status") @db.VarChar(80)\n  externalFee       Decimal?  @map("external_fee") @db.Decimal(12, 2)\n  rawCreatePayload  Json?     @map("raw_create_payload")\n  rawCreateResponse Json?     @map("raw_create_response")\n  rawLatestStatus   Json?     @map("raw_latest_status")\n  lastSyncedAt      DateTime? @map("last_synced_at")\n  deliveredAt       DateTime? @map("delivered_at")\n  createdAt         DateTime  @default(now()) @map("created_at")\n  updatedAt         DateTime  @updatedAt @map("updated_at")\n\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@index([provider, providerStatus])\n  @@map("return_shipments")\n}\n\n/// Chi ti\u1EBFt \u0111\u01A1n h\xE0ng\nmodel OrderItem {\n  id                      String  @id @default(uuid()) @db.VarChar(36)\n  orderId                 String  @map("order_id") @db.VarChar(36)\n  productId               String  @map("product_id") @db.VarChar(36)\n  variantId               String? @map("variant_id") @db.VarChar(36)\n  quantity                Int\n  price                   Decimal @db.Decimal(10, 2)\n  productName             String  @default("") @map("product_name") @db.VarChar(255)\n  productSlug             String? @map("product_slug") @db.VarChar(255)\n  sku                     String  @default("") @db.VarChar(100)\n  variantName             String? @map("variant_name") @db.VarChar(255)\n  variantAttributes       Json?   @map("variant_attributes")\n  imageUrl                String? @map("image_url") @db.VarChar(1000)\n  originalUnitPrice       Decimal @default(0) @map("original_unit_price") @db.Decimal(10, 2)\n  sellingUnitPrice        Decimal @default(0) @map("selling_unit_price") @db.Decimal(10, 2)\n  lineSubtotal            Decimal @default(0) @map("line_subtotal") @db.Decimal(10, 2)\n  lineDiscountAmount      Decimal @default(0) @map("line_discount_amount") @db.Decimal(10, 2)\n  promotionDiscountAmount Decimal @default(0) @map("promotion_discount_amount") @db.Decimal(10, 2)\n  voucherDiscountAmount   Decimal @default(0) @map("voucher_discount_amount") @db.Decimal(10, 2)\n  lineTotal               Decimal @default(0) @map("line_total") @db.Decimal(10, 2)\n  voucherEligible         Boolean @default(false) @map("voucher_eligible")\n  promotionId             String? @map("promotion_id") @db.VarChar(36)\n  promotionName           String? @map("promotion_name") @db.VarChar(255)\n  promotionSnapshot       Json?   @map("promotion_snapshot")\n  snapshotSource          String  @default("CHECKOUT") @map("snapshot_source") @db.VarChar(40)\n\n  // Relations\n  order     Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  product   Product         @relation(fields: [productId], references: [id])\n  variant   ProductVariant? @relation(fields: [variantId], references: [id])\n  promotion Promotion?      @relation(fields: [promotionId], references: [id])\n  returns   Return[]\n  reviews   Review[]        @relation("OrderItemReviews")\n\n  @@unique([orderId, productId, variantId])\n  @@index([productId])\n  @@index([variantId])\n  @@map("order_items")\n}\n\n// ============================================================================\n// PAYMENT (1 order = 1 payment ch\xEDnh)\n// ============================================================================\n\n/// Thanh to\xE1n - 1:1 v\u1EDBi \u0111\u01A1n h\xE0ng\nmodel Payment {\n  id            String        @id @default(uuid()) @db.VarChar(36)\n  orderId       String        @unique @map("order_id") @db.VarChar(36)\n  amount        Decimal       @db.Decimal(10, 2)\n  method        String        @db.VarChar(50)\n  transactionId String?       @unique @map("transaction_id") @db.VarChar(255)\n  status        PaymentStatus @default(PENDING)\n\n  createdAt DateTime  @default(now()) @map("created_at")\n  paidAt    DateTime? @map("paid_at")\n\n  // Relations\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@map("payments")\n}\n\n/// Giao d\u1ECBch thanh toan online (idempotent qua trang thai PENDING)\nmodel PaymentTransaction {\n  id               String                   @id @default(uuid()) @db.VarChar(36)\n  orderId          String                   @unique @map("order_id") @db.VarChar(36)\n  orderCode        String                   @unique @map("order_code") @db.VarChar(64)\n  amount           Decimal                  @db.Decimal(10, 2)\n  status           PaymentTransactionStatus @default(PENDING)\n  bankCode         String?                  @map("bank_code") @db.VarChar(20)\n  gatewayReference String?                  @unique @map("vnp_transaction_no") @db.VarChar(64)\n  gatewayCode      String?                  @map("vnp_response_code") @db.VarChar(10)\n  gatewayStatus    String?                  @map("vnp_transaction_status") @db.VarChar(10)\n  paidAt           DateTime?                @map("paid_at")\n  rawPayload       Json?                    @map("raw_payload")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  // Relations\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@index([status])\n  @@index([orderCode])\n  @@map("payment_transactions")\n}\n\n// ============================================================================\n// PRICING HISTORY\n// ============================================================================\n\n/// L\u1ECBch s\u1EED thay \u0111\u1ED5i gi\xE1 - ph\u1EE5c v\u1EE5 analytics v\xE0 audit\nmodel ProductPriceHistory {\n  id        String  @id @default(uuid()) @db.VarChar(36)\n  productId String  @map("product_id") @db.VarChar(36)\n  variantId String? @map("variant_id") @db.VarChar(36)\n  oldPrice  Decimal @map("old_price") @db.Decimal(10, 2)\n  newPrice  Decimal @map("new_price") @db.Decimal(10, 2)\n  changedBy String? @map("changed_by") @db.VarChar(36)\n\n  changedAt DateTime @default(now()) @map("changed_at")\n\n  // Relations\n  product Product         @relation(fields: [productId], references: [id], onDelete: Cascade)\n  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)\n\n  @@index([productId])\n  @@index([variantId])\n  @@map("product_price_history")\n}\n\n// ============================================================================\n// PROMOTIONS\n// ============================================================================\n\n/// M\xE3 gi\u1EA3m gi\xE1\nmodel Discount {\n  id                 String                @id @default(uuid()) @db.VarChar(36)\n  code               String                @unique @db.VarChar(50)\n  description        String?               @db.VarChar(500)\n  type               DiscountType\n  value              Decimal               @db.Decimal(10, 2)\n  maxDiscount        Decimal?              @map("max_discount") @db.Decimal(10, 2)\n  minOrderAmount     Decimal?              @map("min_order_amount") @db.Decimal(10, 2)\n  maxUsage           Int?                  @map("max_usage")\n  userUsageLimit     Int?                  @map("user_usage_limit")\n  usedCount          Int                   @default(0) @map("used_count")\n  startAt            DateTime              @map("start_at")\n  endAt              DateTime              @map("end_at")\n  isActive           Boolean               @default(true) @map("is_active")\n  isBirthdayVoucher  Boolean               @default(false) @map("is_birthday_voucher")\n  bannerImageUrl     String?               @map("banner_image_url") @db.VarChar(1000)\n  scopeType          VoucherScopeType      @default(ALL_PRODUCTS) @map("scope_type")\n  includeDescendants Boolean               @default(false) @map("include_descendants")\n  minAmountBasis     VoucherMinAmountBasis @default(ELIGIBLE_SUBTOTAL) @map("min_amount_basis")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  // Relations\n  usages             DiscountUsage[]\n  birthdayGrants     BirthdayVoucherGrant[]\n  orders             Order[]\n  includedCategories DiscountIncludedCategory[]\n  excludedCategories DiscountExcludedCategory[]\n  includedProducts   DiscountIncludedProduct[]\n  excludedProducts   DiscountExcludedProduct[]\n  memberTiers        DiscountMemberTier[]\n\n  @@index([isActive, startAt, endAt])\n  @@map("discounts")\n}\n\nmodel Banner {\n  id          String  @id @default(uuid()) @db.VarChar(36)\n  title       String  @db.VarChar(255)\n  subtitle    String? @db.VarChar(255)\n  description String? @db.VarChar(500)\n  imageUrl    String  @map("image_url") @db.VarChar(1000)\n  isActive    Boolean @default(false) @map("is_active")\n  sortOrder   Int     @default(0) @map("sort_order")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  @@index([isActive, sortOrder])\n  @@map("banners")\n}\n\n/// L\u1ECBch s\u1EED s\u1EED d\u1EE5ng m\xE3 gi\u1EA3m gi\xE1\nmodel DiscountUsage {\n  id         String @id @default(uuid()) @db.VarChar(36)\n  discountId String @map("discount_id") @db.VarChar(36)\n  userId     String @map("user_id") @db.VarChar(36)\n  orderId    String @unique @map("order_id") @db.VarChar(36)\n  usageYear  Int?   @map("usage_year")\n\n  // Relations\n  discount Discount @relation(fields: [discountId], references: [id])\n  order    Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@unique([discountId, userId, usageYear])\n  @@index([discountId])\n  @@index([userId])\n  @@map("discount_usages")\n}\n\nmodel BirthdayVoucherGrant {\n  id             String    @id @default(uuid()) @db.VarChar(36)\n  userId         String    @map("user_id") @db.VarChar(36)\n  discountId     String    @map("discount_id") @db.VarChar(36)\n  year           Int\n  birthdayDate   DateTime  @map("birthday_date") @db.Date\n  email          String    @db.VarChar(255)\n  emailSentAt    DateTime? @map("email_sent_at")\n  idempotencyKey String    @unique @map("idempotency_key") @db.VarChar(120)\n  createdAt      DateTime  @default(now()) @map("created_at")\n  updatedAt      DateTime  @updatedAt @map("updated_at")\n\n  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  discount Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, year])\n  @@index([discountId])\n  @@index([birthdayDate])\n  @@map("birthday_voucher_grants")\n}\n\n// ============================================================================\n// INVENTORY LOG (Audit kho h\xE0ng)\n// ============================================================================\n\n/// L\u1ECBch s\u1EED nh\u1EADp/xu\u1EA5t kho - theo d\xF5i \u1EDF c\u1EA5p\u0111\u1ED9 variant\nmodel InventoryLog {\n  id             String          @id @default(uuid()) @db.VarChar(36)\n  variantId      String          @map("variant_id") @db.VarChar(36)\n  action         InventoryAction\n  quantity       Int\n  referenceId    String?         @map("reference_id") @db.VarChar(36)\n  beforeQuantity Int?            @map("before_quantity")\n  afterQuantity  Int?            @map("after_quantity")\n  referenceType  String?         @map("reference_type") @db.VarChar(50)\n  actorId        String?         @map("actor_id") @db.VarChar(36)\n  reason         String?         @db.VarChar(500)\n  salesChannel   SalesChannel    @default(INTERNAL) @map("sales_channel")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  variant ProductVariant @relation(fields: [variantId], references: [id])\n\n  @@index([variantId])\n  @@map("inventory_logs")\n}\n\n// ============================================================================\n// RETURNS (\u0110\xFAng c\u1EA5p order_item)\n// ============================================================================\n\n/// Y\xEAu c\u1EA7u tr\u1EA3 h\xE0ng - li\xEAn k\u1EBFt v\u1EDBi t\u1EEBng order_item\nmodel Return {\n  id                 String            @id @default(uuid()) @db.VarChar(36)\n  orderItemId        String            @map("order_item_id") @db.VarChar(36)\n  quantity           Int\n  requestType        ReturnRequestType @default(RETURN_REFUND) @map("request_type")\n  requestedVariantId String?           @map("requested_variant_id") @db.VarChar(36)\n  reason             String?           @db.Text\n  reasonCode         String?           @map("reason_code") @db.VarChar(50)\n  evidenceImages     Json?             @map("evidence_images")\n  bankAccountName    String?           @map("bank_account_name") @db.VarChar(255)\n  bankAccountNumber  String?           @map("bank_account_number") @db.VarChar(50)\n  bankName           String?           @map("bank_name") @db.VarChar(120)\n  status             ReturnStatus      @default(RT_REQUESTED)\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  orderItem OrderItem @relation(fields: [orderItemId], references: [id])\n\n  @@index([orderItemId])\n  @@index([reasonCode])\n  @@index([requestType])\n  @@index([requestedVariantId])\n  @@map("returns")\n}\n\n// ============================================================================\n// ORDER STATUS HISTORY\n// ============================================================================\n\n/// L\u1ECBch s\u1EED thay \u0111\u1ED5i tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng\nmodel OrderStatusHistory {\n  id        String       @id @default(uuid()) @db.VarChar(36)\n  orderId   String       @map("order_id") @db.VarChar(36)\n  oldStatus OrderStatus? @map("old_status")\n  newStatus OrderStatus  @map("new_status")\n  changedBy String?      @map("changed_by") @db.VarChar(36)\n  reason    String?      @db.VarChar(500)\n\n  changedAt DateTime @default(now()) @map("changed_at")\n\n  // Relations\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@index([orderId])\n  @@map("order_status_history")\n}\n\n// ============================================================================\n// NOTIFICATIONS\n// ============================================================================\n\n/// Th\xF4ng b\xE1o cho ng\u01B0\u1EDDi d\xF9ng\nmodel Notification {\n  id      String  @id @default(uuid()) @db.VarChar(36)\n  userId  String  @map("user_id") @db.VarChar(36)\n  content String  @db.Text\n  isRead  Boolean @default(false) @map("is_read")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("notifications")\n}\n\n// ============================================================================\n// USER ACTIVITY LOG (Ph\xE2n t\xEDch h\xE0nh vi)\n// ============================================================================\n\n/// L\u1ECBch s\u1EED ho\u1EA1t \u0111\u1ED9ng ng\u01B0\u1EDDi d\xF9ng - ph\u1EE5c v\u1EE5 ph\xE2n t\xEDch AI\nmodel UserActivityLog {\n  id       String  @id @default(uuid()) @db.VarChar(36)\n  userId   String? @map("user_id") @db.VarChar(36)\n  action   String  @db.VarChar(255)\n  metadata Json?\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user User? @relation(fields: [userId], references: [id])\n\n  @@index([userId])\n  @@map("user_activity_logs")\n}\n\nmodel DiscountIncludedCategory {\n  discountId String   @map("discount_id") @db.VarChar(36)\n  categoryId String   @map("category_id") @db.VarChar(36)\n  discount   Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)\n  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@id([discountId, categoryId])\n  @@index([categoryId])\n  @@map("discount_included_categories")\n}\n\nmodel DiscountExcludedCategory {\n  discountId String   @map("discount_id") @db.VarChar(36)\n  categoryId String   @map("category_id") @db.VarChar(36)\n  discount   Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)\n  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@id([discountId, categoryId])\n  @@index([categoryId])\n  @@map("discount_excluded_categories")\n}\n\nmodel DiscountIncludedProduct {\n  discountId String   @map("discount_id") @db.VarChar(36)\n  productId  String   @map("product_id") @db.VarChar(36)\n  discount   Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)\n  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)\n\n  @@id([discountId, productId])\n  @@index([productId])\n  @@map("discount_included_products")\n}\n\nmodel DiscountExcludedProduct {\n  discountId String   @map("discount_id") @db.VarChar(36)\n  productId  String   @map("product_id") @db.VarChar(36)\n  discount   Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)\n  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)\n\n  @@id([discountId, productId])\n  @@index([productId])\n  @@map("discount_excluded_products")\n}\n\nmodel DiscountMemberTier {\n  discountId String   @map("discount_id") @db.VarChar(36)\n  tier       String   @db.VarChar(30)\n  discount   Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)\n\n  @@id([discountId, tier])\n  @@map("discount_member_tiers")\n}\n\nmodel ChatSession {\n  id                      String            @id @default(uuid()) @db.VarChar(36)\n  userId                  String?           @map("user_id") @db.VarChar(36)\n  status                  ChatSessionStatus @default(OPEN)\n  channel                 String            @default("WEB_WIDGET") @db.VarChar(40)\n  guestToken              String?           @map("guest_token") @db.VarChar(100)\n  leadName                String?           @map("lead_name") @db.VarChar(120)\n  leadPhone               String?           @map("lead_phone") @db.VarChar(20)\n  leadEmail               String?           @map("lead_email") @db.VarChar(255)\n  budgetMin               Decimal?          @map("budget_min") @db.Decimal(10, 2)\n  budgetMax               Decimal?          @map("budget_max") @db.Decimal(10, 2)\n  shopperProfile          Json?             @map("shopper_profile")\n  lastIntent              String?           @map("last_intent") @db.VarChar(80)\n  lastSummary             String?           @map("last_summary") @db.VarChar(500)\n  lastSuggestedProductIds Json?             @map("last_suggested_product_ids")\n  lastMessageAt           DateTime          @default(now()) @map("last_message_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  user     User?         @relation(fields: [userId], references: [id], onDelete: SetNull)\n  messages ChatMessage[]\n\n  @@index([userId, lastMessageAt])\n  @@index([status, lastMessageAt])\n  @@index([leadPhone])\n  @@index([leadEmail])\n  @@map("chat_sessions")\n}\n\nmodel ChatMessage {\n  id        String          @id @default(uuid()) @db.VarChar(36)\n  sessionId String          @map("session_id") @db.VarChar(36)\n  role      ChatMessageRole\n  content   String          @db.Text\n  metadata  Json?\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)\n\n  @@index([sessionId, createdAt])\n  @@map("chat_messages")\n}\n\nmodel RecommendationEvent {\n  id          String                  @id @default(uuid()) @db.VarChar(36)\n  eventType   RecommendationEventType @map("event_type")\n  userId      String?                 @map("user_id") @db.VarChar(36)\n  sessionId   String                  @map("session_id") @db.VarChar(100)\n  productId   String?                 @map("product_id") @db.VarChar(36)\n  orderId     String?                 @map("order_id") @db.VarChar(36)\n  searchQuery String?                 @map("search_query") @db.VarChar(255)\n  dedupeKey   String                  @unique @map("dedupe_key") @db.VarChar(120)\n  source      String?                 @db.VarChar(100)\n  placement   String?                 @db.VarChar(120)\n  metadata    Json?\n  occurredAt  DateTime                @map("occurred_at")\n  processedAt DateTime?               @map("processed_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  user    User?    @relation(fields: [userId], references: [id], onDelete: SetNull)\n  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)\n\n  @@index([eventType, occurredAt])\n  @@index([userId, occurredAt])\n  @@index([productId, occurredAt])\n  @@index([sessionId, occurredAt])\n  @@map("recommendation_events")\n}\n\nmodel ProductSimilarity {\n  productId        String  @map("product_id") @db.VarChar(36)\n  relatedProductId String  @map("related_product_id") @db.VarChar(36)\n  algorithm        String  @db.VarChar(50)\n  score            Decimal @db.Decimal(8, 4)\n  rank             Int     @default(0)\n  metadata         Json?\n\n  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")\n  createdAt DateTime @default(now()) @map("created_at")\n\n  product        Product @relation("ProductSimilaritySource", fields: [productId], references: [id], onDelete: Cascade)\n  relatedProduct Product @relation("ProductSimilarityTarget", fields: [relatedProductId], references: [id], onDelete: Cascade)\n\n  @@id([productId, relatedProductId, algorithm])\n  @@index([relatedProductId, algorithm, score])\n  @@index([algorithm, score])\n  @@map("product_similarities")\n}\n\nmodel RecommendationCache {\n  id        String                  @id @default(uuid()) @db.VarChar(36)\n  cacheKey  String                  @unique @map("cache_key") @db.VarChar(255)\n  modelKind RecommendationModelKind @map("model_kind")\n  userId    String?                 @map("user_id") @db.VarChar(36)\n  productId String?                 @map("product_id") @db.VarChar(36)\n  sessionId String?                 @map("session_id") @db.VarChar(100)\n  itemsJson Json                    @map("items_json")\n  metadata  Json?\n  expiresAt DateTime                @map("expires_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  user    User?    @relation(fields: [userId], references: [id], onDelete: SetNull)\n  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)\n\n  @@index([modelKind, expiresAt])\n  @@index([userId, modelKind])\n  @@index([productId, modelKind])\n  @@map("recommendation_caches")\n}\n\nmodel ProductEmbedding {\n  productId     String  @id @map("product_id") @db.VarChar(36)\n  embedding     Json\n  embeddingText String? @map("embedding_text") @db.Text\n  modelVersion  String  @map("model_version") @db.VarChar(80)\n  dimensions    Int\n  metadata      Json?\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)\n\n  @@map("product_embeddings")\n}\n\nmodel UserEmbedding {\n  userId       String    @id @map("user_id") @db.VarChar(36)\n  embedding    Json\n  modelVersion String    @map("model_version") @db.VarChar(80)\n  dimensions   Int\n  lastEventAt  DateTime? @map("last_event_at")\n  metadata     Json?\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map("user_embeddings")\n}\n\nmodel RecommendationExperiment {\n  id          String    @id @default(uuid()) @db.VarChar(36)\n  key         String    @unique @db.VarChar(80)\n  name        String    @db.VarChar(255)\n  description String?   @db.VarChar(500)\n  status      String    @db.VarChar(40)\n  traffic     Int       @default(100)\n  variants    Json\n  metadata    Json?\n  startAt     DateTime? @map("start_at")\n  endAt       DateTime? @map("end_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  @@index([status, startAt, endAt])\n  @@map("recommendation_experiments")\n}\n\nmodel RecommendationMetricSnapshot {\n  id          String   @id @default(uuid()) @db.VarChar(36)\n  metricDate  DateTime @map("metric_date")\n  metricName  String   @map("metric_name") @db.VarChar(120)\n  metricValue Decimal  @map("metric_value") @db.Decimal(14, 4)\n  dimensions  Json?\n  metadata    Json?\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  @@index([metricDate, metricName])\n  @@map("recommendation_metric_snapshots")\n}\n\nmodel VirtualTryOnRequest {\n  id               String             @id @default(uuid()) @db.VarChar(36)\n  userId           String             @map("user_id") @db.VarChar(36)\n  productId        String             @map("product_id") @db.VarChar(36)\n  productImageUrl  String             @map("product_image_url") @db.VarChar(1000)\n  humanImageUrl    String             @map("human_image_url") @db.VarChar(1000)\n  outputImageUrl   String?            @map("output_image_url") @db.VarChar(1000)\n  outputPublicId   String?            @map("output_public_id") @db.VarChar(255)\n  provider         String             @default("replicate") @db.VarChar(80)\n  modelName        String             @default("cuuupid/idm-vton") @map("model_name") @db.VarChar(160)\n  providerJobId    String?            @map("provider_job_id") @db.VarChar(160)\n  status           VirtualTryOnStatus @default(PENDING)\n  category         String             @db.VarChar(40)\n  garmentDes       String             @map("garment_des") @db.VarChar(500)\n  crop             Boolean            @default(false)\n  forceDc          Boolean            @default(false) @map("force_dc")\n  maskOnly         Boolean            @default(false) @map("mask_only")\n  steps            Int                @default(30)\n  seed             Int?\n  latencyMs        Int?               @map("latency_ms")\n  estimatedCostUsd Decimal?           @map("estimated_cost_usd") @db.Decimal(10, 4)\n  errorCode        String?            @map("error_code") @db.VarChar(80)\n  errorMessage     String?            @map("error_message") @db.VarChar(500)\n  startedAt        DateTime?          @map("started_at")\n  completedAt      DateTime?          @map("completed_at")\n  deletedAt        DateTime?          @map("deleted_at")\n  createdAt        DateTime           @default(now()) @map("created_at")\n  updatedAt        DateTime           @updatedAt @map("updated_at")\n\n  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)\n\n  @@index([userId, createdAt])\n  @@index([productId])\n  @@index([status])\n  @@index([providerJobId])\n  @@map("virtual_try_on_requests")\n}\n\n// ============================================================================\n// WISHLIST\n// ============================================================================\n\n/// Danh s\xE1ch y\xEAu th\xEDch\nmodel Wishlist {\n  id        String @id @default(uuid()) @db.VarChar(36)\n  userId    String @map("user_id") @db.VarChar(36)\n  productId String @map("product_id") @db.VarChar(36)\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n  product Product @relation(fields: [productId], references: [id])\n\n  @@unique([userId, productId])\n  @@index([productId])\n  @@map("wishlists")\n}\n\n// ============================================================================\n// REVIEWS\n// ============================================================================\n\n/// \u0110\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m - m\u1ED7i user ch\u1EC9 \u0111\xE1nh gi\xE1 1 l\u1EA7n/s\u1EA3n ph\u1EA9m\nmodel Review {\n  id          String  @id @default(uuid()) @db.VarChar(36)\n  userId      String  @map("user_id") @db.VarChar(36)\n  productId   String  @map("product_id") @db.VarChar(36)\n  orderItemId String? @map("order_item_id") @db.VarChar(36)\n  rating      Int // 1-5\n  comment     String? @db.Text\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  user      User          @relation(fields: [userId], references: [id])\n  product   Product       @relation(fields: [productId], references: [id])\n  orderItem OrderItem?    @relation("OrderItemReviews", fields: [orderItemId], references: [id], onDelete: Cascade)\n  images    ReviewImage[]\n\n  @@unique([userId, orderItemId])\n  @@index([productId])\n  @@index([orderItemId])\n  @@map("reviews")\n}\n\nmodel ReviewImage {\n  id        String  @id @default(uuid()) @db.VarChar(36)\n  reviewId  String  @map("review_id") @db.VarChar(36)\n  url       String  @db.VarChar(1000)\n  publicId  String? @map("public_id") @db.VarChar(255)\n  sortOrder Int     @default(0) @map("sort_order")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  // Relations\n  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)\n\n  @@index([reviewId])\n  @@map("review_images")\n}\n\n// ============================================================================\n// AUDIT LOG (Chu\u1EA9n compliance)\n// ============================================================================\n\n/// Nh\u1EADt k\xFD ki\u1EC3m to\xE1n - theo d\xF5i m\u1ECDi thay \u0111\u1ED5i trong h\u1EC7 th\u1ED1ng\nmodel AuditLog {\n  id         String    @id @default(uuid()) @db.VarChar(36)\n  actorType  ActorType @map("actor_type")\n  actorId    String?   @map("actor_id") @db.VarChar(36)\n  targetType String?   @map("target_type") @db.VarChar(100)\n  targetId   String?   @map("target_id") @db.VarChar(36)\n  action     String    @db.VarChar(255)\n  oldData    Json?     @map("old_data")\n  newData    Json?     @map("new_data")\n\n  createdAt DateTime @default(now()) @map("created_at")\n\n  @@index([actorId])\n  @@map("audit_logs")\n}\n\nmodel RefundTransaction {\n  id               String       @id @default(uuid()) @db.VarChar(36)\n  orderId          String       @map("order_id") @db.VarChar(36)\n  type             RefundType\n  amount           Decimal      @db.Decimal(10, 2)\n  currency         String       @default("VND") @db.VarChar(10)\n  status           RefundStatus @default(PENDING)\n  provider         String?      @db.VarChar(50)\n  providerRefundId String?      @unique @map("provider_refund_id") @db.VarChar(100)\n  reason           String?      @db.Text\n  initiatedBy      ActorType    @default(SYSTEM) @map("initiated_by")\n  idempotencyKey   String       @unique @map("idempotency_key") @db.VarChar(120)\n  failureReason    String?      @map("failure_reason") @db.VarChar(500)\n  retryCount       Int          @default(0) @map("retry_count")\n  requestedAt      DateTime     @default(now()) @map("requested_at")\n  processedAt      DateTime?    @map("processed_at")\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@unique([orderId, type])\n  @@index([orderId])\n  @@index([status])\n  @@index([type])\n  @@map("refund_transactions")\n}\n\nmodel OrderCancelRequest {\n  id                String              @id @default(uuid()) @db.VarChar(36)\n  orderId           String              @unique @map("order_id") @db.VarChar(36)\n  reasonCode        CancelReason        @map("reason_code")\n  reasonText        String?             @map("reason_text") @db.VarChar(500)\n  status            CancelRequestStatus @default(REQUESTED)\n  requestedByUserId String              @map("requested_by_user_id") @db.VarChar(36)\n  approvedByAdminId String?             @map("approved_by_admin_id") @db.VarChar(36)\n  rejectedByAdminId String?             @map("rejected_by_admin_id") @db.VarChar(36)\n  approvedAt        DateTime?           @map("approved_at")\n  rejectedAt        DateTime?           @map("rejected_at")\n  completedAt       DateTime?           @map("completed_at")\n  rejectionReason   String?             @map("rejection_reason") @db.VarChar(500)\n\n  bankAccountName   String @map("bank_account_name") @db.VarChar(255)\n  bankAccountNumber String @map("bank_account_number") @db.VarChar(50)\n  bankName          String @map("bank_name") @db.VarChar(120)\n\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@index([status])\n  @@index([requestedByUserId])\n  @@map("order_cancel_requests")\n}\n\nmodel LoyaltyAccount {\n  id        String   @id @default(uuid()) @db.VarChar(36)\n  userId    String   @unique @map("user_id") @db.VarChar(36)\n  balance   Int      @default(0)\n  tier      String   @default("MEMBER") @db.VarChar(30)\n  createdAt DateTime @default(now()) @map("created_at")\n  updatedAt DateTime @updatedAt @map("updated_at")\n\n  user         User                 @relation(fields: [userId], references: [id], onDelete: Cascade)\n  transactions LoyaltyTransaction[]\n\n  @@map("loyalty_accounts")\n}\n\nmodel LoyaltyTransaction {\n  id                  String                 @id @default(uuid()) @db.VarChar(36)\n  accountId           String                 @map("account_id") @db.VarChar(36)\n  type                LoyaltyTransactionType\n  points              Int\n  balanceAfter        Int                    @map("balance_after")\n  referenceType       String?                @map("reference_type") @db.VarChar(50)\n  referenceId         String?                @map("reference_id") @db.VarChar(36)\n  idempotencyKey      String                 @unique @map("idempotency_key") @db.VarChar(120)\n  description         String?                @db.VarChar(255)\n  expiresAt           DateTime?              @map("expires_at")\n  expiredAt           DateTime?              @map("expired_at")\n  sourcePoints        Int?                   @map("source_points")\n  sourceTransactionId String?                @map("source_transaction_id") @db.VarChar(36)\n  createdAt           DateTime               @default(now()) @map("created_at")\n\n  account LoyaltyAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)\n\n  @@index([accountId, createdAt])\n  @@index([expiresAt, expiredAt])\n  @@index([referenceType, referenceId])\n  @@map("loyalty_transactions")\n}\n\nmodel LoyaltyConfig {\n  id                Int      @id @default(1)\n  spendPerPoint     Int      @default(10000) @map("spend_per_point")\n  pointValidityDays Int      @default(365) @map("point_validity_days")\n  silverMinPoints   Int      @default(1000) @map("silver_min_points")\n  goldMinPoints     Int      @default(5000) @map("gold_min_points")\n  isActive          Boolean  @default(true) @map("is_active")\n  updatedAt         DateTime @updatedAt @map("updated_at")\n\n  @@map("loyalty_config")\n}\n\nmodel Promotion {\n  id                   String                @id @default(uuid()) @db.VarChar(36)\n  name                 String                @db.VarChar(255)\n  slug                 String                @unique @db.VarChar(255)\n  title                String                @db.VarChar(255)\n  subtitle             String?               @db.VarChar(255)\n  description          String?               @db.Text\n  bannerImageUrl       String?               @map("banner_image_url") @db.VarChar(1000)\n  mobileBannerImageUrl String?               @map("mobile_banner_image_url") @db.VarChar(1000)\n  campaignType         PromotionCampaignType @default(CUSTOM) @map("campaign_type")\n  type                 PromotionType\n  status               PromotionStatus       @default(DRAFT)\n  scopeType            PromotionScopeType    @default(ALL_PRODUCTS) @map("scope_type")\n  includeDescendants   Boolean               @default(false) @map("include_descendants")\n  value                Decimal               @db.Decimal(10, 2)\n  maxDiscount          Decimal?              @map("max_discount") @db.Decimal(10, 2)\n  priority             Int                   @default(0)\n  displayPriority      Int                   @default(0) @map("display_priority")\n  isFeatured           Boolean               @default(false) @map("is_featured")\n  ctaLabel             String?               @map("cta_label") @db.VarChar(100)\n  ctaUrl               String?               @map("cta_url") @db.VarChar(1000)\n  memberTiers          Json?                 @map("member_tiers")\n  usageLimit           Int?                  @map("usage_limit")\n  usedCount            Int                   @default(0) @map("used_count")\n  stackableWithVoucher Boolean               @default(true) @map("stackable_with_voucher")\n  startAt              DateTime              @map("start_at")\n  endAt                DateTime              @map("end_at")\n  createdAt            DateTime              @default(now()) @map("created_at")\n  updatedAt            DateTime              @updatedAt @map("updated_at")\n\n  includedCategories PromotionIncludedCategory[]\n  includedProducts   PromotionIncludedProduct[]\n  orderItems         OrderItem[]\n  usages             PromotionUsage[]\n\n  @@index([status, startAt, endAt])\n  @@index([priority])\n  @@index([isFeatured, displayPriority])\n  @@map("promotions")\n}\n\nmodel PromotionIncludedCategory {\n  promotionId String @map("promotion_id") @db.VarChar(36)\n  categoryId  String @map("category_id") @db.VarChar(36)\n\n  promotion Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)\n  category  Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@id([promotionId, categoryId])\n  @@index([categoryId])\n  @@map("promotion_included_categories")\n}\n\nmodel PromotionIncludedProduct {\n  promotionId String @map("promotion_id") @db.VarChar(36)\n  productId   String @map("product_id") @db.VarChar(36)\n\n  promotion Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)\n  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)\n\n  @@id([promotionId, productId])\n  @@index([productId])\n  @@map("promotion_included_products")\n}\n\nmodel PromotionUsage {\n  id             String   @id @default(uuid()) @db.VarChar(36)\n  promotionId    String   @map("promotion_id") @db.VarChar(36)\n  orderId        String   @map("order_id") @db.VarChar(36)\n  discountAmount Decimal  @map("discount_amount") @db.Decimal(10, 2)\n  idempotencyKey String   @unique @map("idempotency_key") @db.VarChar(120)\n  createdAt      DateTime @default(now()) @map("created_at")\n\n  promotion Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)\n  order     Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@unique([promotionId, orderId])\n  @@index([orderId])\n  @@map("promotion_usages")\n}\n\nmodel PhysicalSale {\n  id             String             @id @default(uuid()) @db.VarChar(36)\n  cashierId      String             @map("cashier_id") @db.VarChar(36)\n  paymentMethod  String             @map("payment_method") @db.VarChar(30)\n  totalAmount    Decimal            @map("total_amount") @db.Decimal(10, 2)\n  code           String             @unique @db.VarChar(40)\n  idempotencyKey String             @unique @map("idempotency_key") @db.VarChar(120)\n  status         PhysicalSaleStatus @default(COMPLETED)\n  customerId     String?            @map("customer_id") @db.VarChar(36)\n  customerName   String?            @map("customer_name") @db.VarChar(255)\n  customerPhone  String?            @map("customer_phone") @db.VarChar(20)\n  paidAt         DateTime           @default(now()) @map("paid_at")\n  cancelledAt    DateTime?          @map("cancelled_at")\n  cancelledBy    String?            @map("cancelled_by") @db.VarChar(36)\n  cancelReason   String?            @map("cancel_reason") @db.VarChar(500)\n  note           String?            @db.VarChar(500)\n  createdAt      DateTime           @default(now()) @map("created_at")\n  items          PhysicalSaleItem[]\n\n  @@index([createdAt])\n  @@index([cashierId])\n  @@index([customerPhone])\n  @@map("physical_sales")\n}\n\nmodel PhysicalSaleItem {\n  id                String         @id @default(uuid()) @db.VarChar(36)\n  saleId            String         @map("sale_id") @db.VarChar(36)\n  variantId         String         @map("variant_id") @db.VarChar(36)\n  quantity          Int\n  unitPrice         Decimal        @map("unit_price") @db.Decimal(10, 2)\n  productName       String         @map("product_name") @db.VarChar(255)\n  sku               String         @db.VarChar(100)\n  variantAttributes Json?          @map("variant_attributes")\n  imageUrl          String?        @map("image_url") @db.VarChar(1000)\n  lineTotal         Decimal        @map("line_total") @db.Decimal(10, 2)\n  sale              PhysicalSale   @relation(fields: [saleId], references: [id], onDelete: Cascade)\n  variant           ProductVariant @relation(fields: [variantId], references: [id])\n\n  @@index([saleId])\n  @@index([variantId])\n  @@map("physical_sale_items")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String","dbName":"password_hash"},{"name":"emailVerified","kind":"scalar","type":"Boolean","dbName":"email_verified"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"lastLogin","kind":"scalar","type":"DateTime","dbName":"last_login"},{"name":"age","kind":"scalar","type":"Int"},{"name":"birthday","kind":"scalar","type":"DateTime"},{"name":"heightCm","kind":"scalar","type":"Decimal","dbName":"height_cm"},{"name":"weightKg","kind":"scalar","type":"Decimal","dbName":"weight_kg"},{"name":"bodyProfileUpdatedAt","kind":"scalar","type":"DateTime","dbName":"body_profile_updated_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"addresses","kind":"object","type":"UserAddress","relationName":"UserToUserAddress"},{"name":"refreshTokens","kind":"object","type":"RefreshToken","relationName":"RefreshTokenToUser"},{"name":"oauthAccounts","kind":"object","type":"OAuthAccount","relationName":"OAuthAccountToUser"},{"name":"emailVerificationTokens","kind":"object","type":"EmailVerificationToken","relationName":"EmailVerificationTokenToUser"},{"name":"passwordResetTokens","kind":"object","type":"PasswordResetToken","relationName":"PasswordResetTokenToUser"},{"name":"userRoles","kind":"object","type":"UserRole","relationName":"UserToUserRole"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"activityLogs","kind":"object","type":"UserActivityLog","relationName":"UserToUserActivityLog"},{"name":"wishlist","kind":"object","type":"Wishlist","relationName":"UserToWishlist"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"recommendationEvents","kind":"object","type":"RecommendationEvent","relationName":"RecommendationEventToUser"},{"name":"recommendationCaches","kind":"object","type":"RecommendationCache","relationName":"RecommendationCacheToUser"},{"name":"userEmbeddings","kind":"object","type":"UserEmbedding","relationName":"UserToUserEmbedding"},{"name":"chatSessions","kind":"object","type":"ChatSession","relationName":"ChatSessionToUser"},{"name":"virtualTryOnRequests","kind":"object","type":"VirtualTryOnRequest","relationName":"UserToVirtualTryOnRequest"},{"name":"loyaltyAccount","kind":"object","type":"LoyaltyAccount","relationName":"LoyaltyAccountToUser"},{"name":"birthdayVoucherGrants","kind":"object","type":"BirthdayVoucherGrant","relationName":"BirthdayVoucherGrantToUser"}],"dbName":"users"},"RefreshToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"token","kind":"scalar","type":"String"},{"name":"deviceInfo","kind":"scalar","type":"String","dbName":"device_info"},{"name":"expiresAt","kind":"scalar","type":"DateTime","dbName":"expires_at"},{"name":"revoked","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"RefreshTokenToUser"}],"dbName":"refresh_tokens"},"EmailVerificationToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"tokenHash","kind":"scalar","type":"String","dbName":"token_hash"},{"name":"expiresAt","kind":"scalar","type":"DateTime","dbName":"expires_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"EmailVerificationTokenToUser"}],"dbName":"email_verification_tokens"},"PasswordResetToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"tokenHash","kind":"scalar","type":"String","dbName":"token_hash"},{"name":"expiresAt","kind":"scalar","type":"DateTime","dbName":"expires_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"PasswordResetTokenToUser"}],"dbName":"password_reset_tokens"},"OAuthAccount":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"provider","kind":"enum","type":"OAuthProvider"},{"name":"providerUserId","kind":"scalar","type":"String","dbName":"provider_user_id"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"OAuthAccountToUser"}],"dbName":"oauth_accounts"},"Role":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"code","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"userRoles","kind":"object","type":"UserRole","relationName":"RoleToUserRole"}],"dbName":"roles"},"UserRole":{"fields":[{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"roleId","kind":"scalar","type":"Int","dbName":"role_id"},{"name":"user","kind":"object","type":"User","relationName":"UserToUserRole"},{"name":"role","kind":"object","type":"Role","relationName":"RoleToUserRole"}],"dbName":"user_roles"},"UserAddress":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"recipient","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"addressLine","kind":"scalar","type":"String","dbName":"address_line"},{"name":"ward","kind":"scalar","type":"String"},{"name":"district","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"isDefault","kind":"scalar","type":"Boolean","dbName":"is_default"},{"name":"ghnProvinceId","kind":"scalar","type":"Int","dbName":"ghn_province_id"},{"name":"ghnDistrictId","kind":"scalar","type":"Int","dbName":"ghn_district_id"},{"name":"ghnWardCode","kind":"scalar","type":"String","dbName":"ghn_ward_code"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"UserToUserAddress"}],"dbName":"user_addresses"},"Product":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productTypeId","kind":"scalar","type":"String","dbName":"product_type_id"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"basePrice","kind":"scalar","type":"Decimal","dbName":"base_price"},{"name":"status","kind":"enum","type":"ProductStatus"},{"name":"isSale","kind":"scalar","type":"Boolean","dbName":"is_sale"},{"name":"isDeleted","kind":"scalar","type":"Boolean","dbName":"is_deleted"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"productType","kind":"object","type":"ProductType","relationName":"ProductToProductType"},{"name":"variants","kind":"object","type":"ProductVariant","relationName":"ProductToProductVariant"},{"name":"images","kind":"object","type":"ProductImage","relationName":"ProductToProductImage"},{"name":"categories","kind":"object","type":"ProductCategory","relationName":"ProductToProductCategory"},{"name":"tags","kind":"object","type":"ProductTag","relationName":"ProductToProductTag"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToProduct"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"OrderItemToProduct"},{"name":"wishlist","kind":"object","type":"Wishlist","relationName":"ProductToWishlist"},{"name":"reviews","kind":"object","type":"Review","relationName":"ProductToReview"},{"name":"priceHistory","kind":"object","type":"ProductPriceHistory","relationName":"ProductToProductPriceHistory"},{"name":"recommendationEvents","kind":"object","type":"RecommendationEvent","relationName":"ProductToRecommendationEvent"},{"name":"similaritySources","kind":"object","type":"ProductSimilarity","relationName":"ProductSimilaritySource"},{"name":"similarityTargets","kind":"object","type":"ProductSimilarity","relationName":"ProductSimilarityTarget"},{"name":"recommendationCaches","kind":"object","type":"RecommendationCache","relationName":"ProductToRecommendationCache"},{"name":"productEmbeddings","kind":"object","type":"ProductEmbedding","relationName":"ProductToProductEmbedding"},{"name":"virtualTryOnRequests","kind":"object","type":"VirtualTryOnRequest","relationName":"ProductToVirtualTryOnRequest"},{"name":"sizeChartRules","kind":"object","type":"SizeChartRule","relationName":"ProductToSizeChartRule"},{"name":"discountIncludes","kind":"object","type":"DiscountIncludedProduct","relationName":"DiscountIncludedProductToProduct"},{"name":"discountExcludes","kind":"object","type":"DiscountExcludedProduct","relationName":"DiscountExcludedProductToProduct"},{"name":"promotionIncludes","kind":"object","type":"PromotionIncludedProduct","relationName":"ProductToPromotionIncludedProduct"},{"name":"attributeValues","kind":"object","type":"ProductAttributeValue","relationName":"ProductToProductAttributeValue"}],"dbName":"products"},"ProductVariant":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"sku","kind":"scalar","type":"String"},{"name":"optionKey","kind":"scalar","type":"String","dbName":"option_key"},{"name":"status","kind":"enum","type":"VariantStatus"},{"name":"isDefault","kind":"scalar","type":"Boolean","dbName":"is_default"},{"name":"attributes","kind":"scalar","type":"Json"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"stockAvailable","kind":"scalar","type":"Int","dbName":"stock_available"},{"name":"stockOnHand","kind":"scalar","type":"Int","dbName":"stock_on_hand"},{"name":"stockReserved","kind":"scalar","type":"Int","dbName":"stock_reserved"},{"name":"minStock","kind":"scalar","type":"Int","dbName":"min_stock"},{"name":"isDeleted","kind":"scalar","type":"Boolean","dbName":"is_deleted"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductVariant"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToProductVariant"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"OrderItemToProductVariant"},{"name":"images","kind":"object","type":"ProductImage","relationName":"ProductImageToProductVariant"},{"name":"inventoryLogs","kind":"object","type":"InventoryLog","relationName":"InventoryLogToProductVariant"},{"name":"priceHistory","kind":"object","type":"ProductPriceHistory","relationName":"ProductPriceHistoryToProductVariant"},{"name":"physicalSaleItems","kind":"object","type":"PhysicalSaleItem","relationName":"PhysicalSaleItemToProductVariant"},{"name":"attributeValues","kind":"object","type":"VariantAttributeValue","relationName":"ProductVariantToVariantAttributeValue"}],"dbName":"product_variants"},"ProductImage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"variantId","kind":"scalar","type":"String","dbName":"variant_id"},{"name":"url","kind":"scalar","type":"String"},{"name":"altText","kind":"scalar","type":"String","dbName":"alt_text"},{"name":"sortOrder","kind":"scalar","type":"Int","dbName":"sort_order"},{"name":"isPrimary","kind":"scalar","type":"Boolean","dbName":"is_primary"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductImage"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"ProductImageToProductVariant"}],"dbName":"product_images"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String","dbName":"image_url"},{"name":"sortOrder","kind":"scalar","type":"Int","dbName":"sort_order"},{"name":"parentId","kind":"scalar","type":"String","dbName":"parent_id"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"parent","kind":"object","type":"Category","relationName":"CategoryHierarchy"},{"name":"children","kind":"object","type":"Category","relationName":"CategoryHierarchy"},{"name":"products","kind":"object","type":"ProductCategory","relationName":"CategoryToProductCategory"},{"name":"discountIncludes","kind":"object","type":"DiscountIncludedCategory","relationName":"CategoryToDiscountIncludedCategory"},{"name":"discountExcludes","kind":"object","type":"DiscountExcludedCategory","relationName":"CategoryToDiscountExcludedCategory"},{"name":"promotionIncludes","kind":"object","type":"PromotionIncludedCategory","relationName":"CategoryToPromotionIncludedCategory"}],"dbName":"categories"},"ProductCategory":{"fields":[{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"categoryId","kind":"scalar","type":"String","dbName":"category_id"},{"name":"isPrimary","kind":"scalar","type":"Boolean","dbName":"is_primary"},{"name":"sortOrder","kind":"scalar","type":"Int","dbName":"sort_order"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductCategory"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToProductCategory"}],"dbName":"product_categories"},"ProductType":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"products","kind":"object","type":"Product","relationName":"ProductToProductType"},{"name":"attributes","kind":"object","type":"ProductTypeAttribute","relationName":"ProductTypeToProductTypeAttribute"},{"name":"sizeChartRules","kind":"object","type":"SizeChartRule","relationName":"ProductTypeToSizeChartRule"}],"dbName":"product_types"},"SizeChartRule":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"productTypeId","kind":"scalar","type":"String","dbName":"product_type_id"},{"name":"sizeLabel","kind":"scalar","type":"String","dbName":"size_label"},{"name":"minHeightCm","kind":"scalar","type":"Decimal","dbName":"min_height_cm"},{"name":"maxHeightCm","kind":"scalar","type":"Decimal","dbName":"max_height_cm"},{"name":"minWeightKg","kind":"scalar","type":"Decimal","dbName":"min_weight_kg"},{"name":"maxWeightKg","kind":"scalar","type":"Decimal","dbName":"max_weight_kg"},{"name":"fitPreference","kind":"scalar","type":"String","dbName":"fit_preference"},{"name":"priority","kind":"scalar","type":"Int"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToSizeChartRule"},{"name":"productType","kind":"object","type":"ProductType","relationName":"ProductTypeToSizeChartRule"}],"dbName":"size_chart_rules"},"AttributeDefinition":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"scope","kind":"enum","type":"AttributeScope"},{"name":"dataType","kind":"enum","type":"AttributeDataType","dbName":"data_type"},{"name":"unit","kind":"scalar","type":"String"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"options","kind":"object","type":"AttributeOption","relationName":"AttributeDefinitionToAttributeOption"},{"name":"typeMaps","kind":"object","type":"ProductTypeAttribute","relationName":"AttributeDefinitionToProductTypeAttribute"},{"name":"productValues","kind":"object","type":"ProductAttributeValue","relationName":"AttributeDefinitionToProductAttributeValue"},{"name":"variantValues","kind":"object","type":"VariantAttributeValue","relationName":"AttributeDefinitionToVariantAttributeValue"}],"dbName":"attribute_definitions"},"AttributeOption":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"attributeId","kind":"scalar","type":"String","dbName":"attribute_id"},{"name":"value","kind":"scalar","type":"String"},{"name":"label","kind":"scalar","type":"String"},{"name":"sortOrder","kind":"scalar","type":"Int","dbName":"sort_order"},{"name":"swatchHex","kind":"scalar","type":"String","dbName":"swatch_hex"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"attribute","kind":"object","type":"AttributeDefinition","relationName":"AttributeDefinitionToAttributeOption"},{"name":"productValues","kind":"object","type":"ProductAttributeValue","relationName":"AttributeOptionToProductAttributeValue"},{"name":"productMultiSelectJoins","kind":"object","type":"ProductAttributeValueOption","relationName":"AttributeOptionToProductAttributeValueOption"},{"name":"variantValues","kind":"object","type":"VariantAttributeValue","relationName":"AttributeOptionToVariantAttributeValue"}],"dbName":"attribute_options"},"ProductTypeAttribute":{"fields":[{"name":"productTypeId","kind":"scalar","type":"String","dbName":"product_type_id"},{"name":"attributeId","kind":"scalar","type":"String","dbName":"attribute_id"},{"name":"isRequired","kind":"scalar","type":"Boolean","dbName":"is_required"},{"name":"isFilterable","kind":"scalar","type":"Boolean","dbName":"is_filterable"},{"name":"isVariantAxis","kind":"scalar","type":"Boolean","dbName":"is_variant_axis"},{"name":"variantAxisOrder","kind":"scalar","type":"Int","dbName":"variant_axis_order"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"productType","kind":"object","type":"ProductType","relationName":"ProductTypeToProductTypeAttribute"},{"name":"attribute","kind":"object","type":"AttributeDefinition","relationName":"AttributeDefinitionToProductTypeAttribute"}],"dbName":"product_type_attributes"},"ProductAttributeValue":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"attributeId","kind":"scalar","type":"String","dbName":"attribute_id"},{"name":"textValue","kind":"scalar","type":"String","dbName":"text_value"},{"name":"numberValue","kind":"scalar","type":"Decimal","dbName":"number_value"},{"name":"booleanValue","kind":"scalar","type":"Boolean","dbName":"boolean_value"},{"name":"dateValue","kind":"scalar","type":"DateTime","dbName":"date_value"},{"name":"optionId","kind":"scalar","type":"String","dbName":"option_id"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductAttributeValue"},{"name":"attribute","kind":"object","type":"AttributeDefinition","relationName":"AttributeDefinitionToProductAttributeValue"},{"name":"option","kind":"object","type":"AttributeOption","relationName":"AttributeOptionToProductAttributeValue"},{"name":"multiSelectOptions","kind":"object","type":"ProductAttributeValueOption","relationName":"ProductAttributeValueToProductAttributeValueOption"}],"dbName":"product_attribute_values"},"ProductAttributeValueOption":{"fields":[{"name":"productAttributeValueId","kind":"scalar","type":"String","dbName":"product_attribute_value_id"},{"name":"optionId","kind":"scalar","type":"String","dbName":"option_id"},{"name":"value","kind":"object","type":"ProductAttributeValue","relationName":"ProductAttributeValueToProductAttributeValueOption"},{"name":"option","kind":"object","type":"AttributeOption","relationName":"AttributeOptionToProductAttributeValueOption"}],"dbName":"product_attribute_value_options"},"VariantAttributeValue":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String","dbName":"variant_id"},{"name":"attributeId","kind":"scalar","type":"String","dbName":"attribute_id"},{"name":"textValue","kind":"scalar","type":"String","dbName":"text_value"},{"name":"numberValue","kind":"scalar","type":"Decimal","dbName":"number_value"},{"name":"booleanValue","kind":"scalar","type":"Boolean","dbName":"boolean_value"},{"name":"dateValue","kind":"scalar","type":"DateTime","dbName":"date_value"},{"name":"optionId","kind":"scalar","type":"String","dbName":"option_id"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"ProductVariantToVariantAttributeValue"},{"name":"attribute","kind":"object","type":"AttributeDefinition","relationName":"AttributeDefinitionToVariantAttributeValue"},{"name":"option","kind":"object","type":"AttributeOption","relationName":"AttributeOptionToVariantAttributeValue"}],"dbName":"variant_attribute_values"},"Tag":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"products","kind":"object","type":"ProductTag","relationName":"ProductTagToTag"}],"dbName":"tags"},"ProductTag":{"fields":[{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"tagId","kind":"scalar","type":"String","dbName":"tag_id"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductTag"},{"name":"tag","kind":"object","type":"Tag","relationName":"ProductTagToTag"}],"dbName":"product_tags"},"Cart":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"CartToUser"},{"name":"items","kind":"object","type":"CartItem","relationName":"CartToCartItem"}],"dbName":"carts"},"CartItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"cartId","kind":"scalar","type":"String","dbName":"cart_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"variantId","kind":"scalar","type":"String","dbName":"variant_id"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToCartItem"},{"name":"product","kind":"object","type":"Product","relationName":"CartItemToProduct"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"CartItemToProductVariant"}],"dbName":"cart_items"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"subtotalPrice","kind":"scalar","type":"Decimal","dbName":"subtotal_price"},{"name":"shippingFee","kind":"scalar","type":"Decimal","dbName":"shipping_fee"},{"name":"totalPrice","kind":"scalar","type":"Decimal","dbName":"total_price"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"returnStatus","kind":"enum","type":"ReturnFlowStatus","dbName":"return_status"},{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"discountAmount","kind":"scalar","type":"Decimal","dbName":"discount_amount"},{"name":"itemsSubtotal","kind":"scalar","type":"Decimal","dbName":"items_subtotal"},{"name":"productDiscount","kind":"scalar","type":"Decimal","dbName":"product_discount"},{"name":"promotionDiscount","kind":"scalar","type":"Decimal","dbName":"promotion_discount"},{"name":"voucherDiscount","kind":"scalar","type":"Decimal","dbName":"voucher_discount"},{"name":"grandTotal","kind":"scalar","type":"Decimal","dbName":"grand_total"},{"name":"carrierName","kind":"scalar","type":"String","dbName":"carrier_name"},{"name":"trackingCode","kind":"scalar","type":"String","dbName":"tracking_code"},{"name":"deliveryNote","kind":"scalar","type":"String","dbName":"delivery_note"},{"name":"shippedAt","kind":"scalar","type":"DateTime","dbName":"shipped_at"},{"name":"deliveredAt","kind":"scalar","type":"DateTime","dbName":"delivered_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"payment","kind":"object","type":"Payment","relationName":"OrderToPayment"},{"name":"paymentTransaction","kind":"object","type":"PaymentTransaction","relationName":"OrderToPaymentTransaction"},{"name":"refundTransactions","kind":"object","type":"RefundTransaction","relationName":"OrderToRefundTransaction"},{"name":"cancelRequest","kind":"object","type":"OrderCancelRequest","relationName":"OrderToOrderCancelRequest"},{"name":"statusHistory","kind":"object","type":"OrderStatusHistory","relationName":"OrderToOrderStatusHistory"},{"name":"shippingAddress","kind":"object","type":"OrderShippingAddress","relationName":"OrderToOrderShippingAddress"},{"name":"discount","kind":"object","type":"Discount","relationName":"DiscountToOrder"},{"name":"discountUsage","kind":"object","type":"DiscountUsage","relationName":"DiscountUsageToOrder"},{"name":"promotionUsages","kind":"object","type":"PromotionUsage","relationName":"OrderToPromotionUsage"},{"name":"shipment","kind":"object","type":"OrderShipment","relationName":"OrderToOrderShipment"},{"name":"returnShipment","kind":"object","type":"ReturnShipment","relationName":"OrderToReturnShipment"}],"dbName":"orders"},"OrderShippingAddress":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"recipientName","kind":"scalar","type":"String","dbName":"recipient_name"},{"name":"phone","kind":"scalar","type":"String"},{"name":"addressLine","kind":"scalar","type":"String","dbName":"address_line"},{"name":"ward","kind":"scalar","type":"String"},{"name":"district","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"sourceAddressId","kind":"scalar","type":"String","dbName":"source_address_id"},{"name":"snapshotSource","kind":"scalar","type":"String","dbName":"snapshot_source"},{"name":"ghnProvinceId","kind":"scalar","type":"Int","dbName":"ghn_province_id"},{"name":"ghnDistrictId","kind":"scalar","type":"Int","dbName":"ghn_district_id"},{"name":"ghnWardCode","kind":"scalar","type":"String","dbName":"ghn_ward_code"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderShippingAddress"}],"dbName":"order_shipping_addresses"},"OrderShipment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"provider","kind":"scalar","type":"String"},{"name":"providerOrderCode","kind":"scalar","type":"String","dbName":"provider_order_code"},{"name":"providerStatus","kind":"scalar","type":"String","dbName":"provider_status"},{"name":"serviceId","kind":"scalar","type":"Int","dbName":"service_id"},{"name":"serviceTypeId","kind":"scalar","type":"Int","dbName":"service_type_id"},{"name":"codAmount","kind":"scalar","type":"Decimal","dbName":"cod_amount"},{"name":"externalFee","kind":"scalar","type":"Decimal","dbName":"external_fee"},{"name":"rawCreatePayload","kind":"scalar","type":"Json","dbName":"raw_create_payload"},{"name":"rawCreateResponse","kind":"scalar","type":"Json","dbName":"raw_create_response"},{"name":"rawLatestWebhook","kind":"scalar","type":"Json","dbName":"raw_latest_webhook"},{"name":"lastWebhookTime","kind":"scalar","type":"DateTime","dbName":"last_webhook_time"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderShipment"}],"dbName":"order_shipments"},"ReturnShipment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"provider","kind":"scalar","type":"String"},{"name":"providerOrderCode","kind":"scalar","type":"String","dbName":"provider_order_code"},{"name":"providerStatus","kind":"scalar","type":"String","dbName":"provider_status"},{"name":"externalFee","kind":"scalar","type":"Decimal","dbName":"external_fee"},{"name":"rawCreatePayload","kind":"scalar","type":"Json","dbName":"raw_create_payload"},{"name":"rawCreateResponse","kind":"scalar","type":"Json","dbName":"raw_create_response"},{"name":"rawLatestStatus","kind":"scalar","type":"Json","dbName":"raw_latest_status"},{"name":"lastSyncedAt","kind":"scalar","type":"DateTime","dbName":"last_synced_at"},{"name":"deliveredAt","kind":"scalar","type":"DateTime","dbName":"delivered_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReturnShipment"}],"dbName":"return_shipments"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"variantId","kind":"scalar","type":"String","dbName":"variant_id"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"productName","kind":"scalar","type":"String","dbName":"product_name"},{"name":"productSlug","kind":"scalar","type":"String","dbName":"product_slug"},{"name":"sku","kind":"scalar","type":"String"},{"name":"variantName","kind":"scalar","type":"String","dbName":"variant_name"},{"name":"variantAttributes","kind":"scalar","type":"Json","dbName":"variant_attributes"},{"name":"imageUrl","kind":"scalar","type":"String","dbName":"image_url"},{"name":"originalUnitPrice","kind":"scalar","type":"Decimal","dbName":"original_unit_price"},{"name":"sellingUnitPrice","kind":"scalar","type":"Decimal","dbName":"selling_unit_price"},{"name":"lineSubtotal","kind":"scalar","type":"Decimal","dbName":"line_subtotal"},{"name":"lineDiscountAmount","kind":"scalar","type":"Decimal","dbName":"line_discount_amount"},{"name":"promotionDiscountAmount","kind":"scalar","type":"Decimal","dbName":"promotion_discount_amount"},{"name":"voucherDiscountAmount","kind":"scalar","type":"Decimal","dbName":"voucher_discount_amount"},{"name":"lineTotal","kind":"scalar","type":"Decimal","dbName":"line_total"},{"name":"voucherEligible","kind":"scalar","type":"Boolean","dbName":"voucher_eligible"},{"name":"promotionId","kind":"scalar","type":"String","dbName":"promotion_id"},{"name":"promotionName","kind":"scalar","type":"String","dbName":"promotion_name"},{"name":"promotionSnapshot","kind":"scalar","type":"Json","dbName":"promotion_snapshot"},{"name":"snapshotSource","kind":"scalar","type":"String","dbName":"snapshot_source"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"product","kind":"object","type":"Product","relationName":"OrderItemToProduct"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"OrderItemToProductVariant"},{"name":"promotion","kind":"object","type":"Promotion","relationName":"OrderItemToPromotion"},{"name":"returns","kind":"object","type":"Return","relationName":"OrderItemToReturn"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderItemReviews"}],"dbName":"order_items"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"method","kind":"scalar","type":"String"},{"name":"transactionId","kind":"scalar","type":"String","dbName":"transaction_id"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"paidAt","kind":"scalar","type":"DateTime","dbName":"paid_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToPayment"}],"dbName":"payments"},"PaymentTransaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"orderCode","kind":"scalar","type":"String","dbName":"order_code"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"PaymentTransactionStatus"},{"name":"bankCode","kind":"scalar","type":"String","dbName":"bank_code"},{"name":"gatewayReference","kind":"scalar","type":"String","dbName":"vnp_transaction_no"},{"name":"gatewayCode","kind":"scalar","type":"String","dbName":"vnp_response_code"},{"name":"gatewayStatus","kind":"scalar","type":"String","dbName":"vnp_transaction_status"},{"name":"paidAt","kind":"scalar","type":"DateTime","dbName":"paid_at"},{"name":"rawPayload","kind":"scalar","type":"Json","dbName":"raw_payload"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToPaymentTransaction"}],"dbName":"payment_transactions"},"ProductPriceHistory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"variantId","kind":"scalar","type":"String","dbName":"variant_id"},{"name":"oldPrice","kind":"scalar","type":"Decimal","dbName":"old_price"},{"name":"newPrice","kind":"scalar","type":"Decimal","dbName":"new_price"},{"name":"changedBy","kind":"scalar","type":"String","dbName":"changed_by"},{"name":"changedAt","kind":"scalar","type":"DateTime","dbName":"changed_at"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductPriceHistory"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"ProductPriceHistoryToProductVariant"}],"dbName":"product_price_history"},"Discount":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"DiscountType"},{"name":"value","kind":"scalar","type":"Decimal"},{"name":"maxDiscount","kind":"scalar","type":"Decimal","dbName":"max_discount"},{"name":"minOrderAmount","kind":"scalar","type":"Decimal","dbName":"min_order_amount"},{"name":"maxUsage","kind":"scalar","type":"Int","dbName":"max_usage"},{"name":"userUsageLimit","kind":"scalar","type":"Int","dbName":"user_usage_limit"},{"name":"usedCount","kind":"scalar","type":"Int","dbName":"used_count"},{"name":"startAt","kind":"scalar","type":"DateTime","dbName":"start_at"},{"name":"endAt","kind":"scalar","type":"DateTime","dbName":"end_at"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"isBirthdayVoucher","kind":"scalar","type":"Boolean","dbName":"is_birthday_voucher"},{"name":"bannerImageUrl","kind":"scalar","type":"String","dbName":"banner_image_url"},{"name":"scopeType","kind":"enum","type":"VoucherScopeType","dbName":"scope_type"},{"name":"includeDescendants","kind":"scalar","type":"Boolean","dbName":"include_descendants"},{"name":"minAmountBasis","kind":"enum","type":"VoucherMinAmountBasis","dbName":"min_amount_basis"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"usages","kind":"object","type":"DiscountUsage","relationName":"DiscountToDiscountUsage"},{"name":"birthdayGrants","kind":"object","type":"BirthdayVoucherGrant","relationName":"BirthdayVoucherGrantToDiscount"},{"name":"orders","kind":"object","type":"Order","relationName":"DiscountToOrder"},{"name":"includedCategories","kind":"object","type":"DiscountIncludedCategory","relationName":"DiscountToDiscountIncludedCategory"},{"name":"excludedCategories","kind":"object","type":"DiscountExcludedCategory","relationName":"DiscountToDiscountExcludedCategory"},{"name":"includedProducts","kind":"object","type":"DiscountIncludedProduct","relationName":"DiscountToDiscountIncludedProduct"},{"name":"excludedProducts","kind":"object","type":"DiscountExcludedProduct","relationName":"DiscountToDiscountExcludedProduct"},{"name":"memberTiers","kind":"object","type":"DiscountMemberTier","relationName":"DiscountToDiscountMemberTier"}],"dbName":"discounts"},"Banner":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"subtitle","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String","dbName":"image_url"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"sortOrder","kind":"scalar","type":"Int","dbName":"sort_order"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"}],"dbName":"banners"},"DiscountUsage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"usageYear","kind":"scalar","type":"Int","dbName":"usage_year"},{"name":"discount","kind":"object","type":"Discount","relationName":"DiscountToDiscountUsage"},{"name":"order","kind":"object","type":"Order","relationName":"DiscountUsageToOrder"}],"dbName":"discount_usages"},"BirthdayVoucherGrant":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"year","kind":"scalar","type":"Int"},{"name":"birthdayDate","kind":"scalar","type":"DateTime","dbName":"birthday_date"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailSentAt","kind":"scalar","type":"DateTime","dbName":"email_sent_at"},{"name":"idempotencyKey","kind":"scalar","type":"String","dbName":"idempotency_key"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"user","kind":"object","type":"User","relationName":"BirthdayVoucherGrantToUser"},{"name":"discount","kind":"object","type":"Discount","relationName":"BirthdayVoucherGrantToDiscount"}],"dbName":"birthday_voucher_grants"},"InventoryLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String","dbName":"variant_id"},{"name":"action","kind":"enum","type":"InventoryAction"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"referenceId","kind":"scalar","type":"String","dbName":"reference_id"},{"name":"beforeQuantity","kind":"scalar","type":"Int","dbName":"before_quantity"},{"name":"afterQuantity","kind":"scalar","type":"Int","dbName":"after_quantity"},{"name":"referenceType","kind":"scalar","type":"String","dbName":"reference_type"},{"name":"actorId","kind":"scalar","type":"String","dbName":"actor_id"},{"name":"reason","kind":"scalar","type":"String"},{"name":"salesChannel","kind":"enum","type":"SalesChannel","dbName":"sales_channel"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"InventoryLogToProductVariant"}],"dbName":"inventory_logs"},"Return":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderItemId","kind":"scalar","type":"String","dbName":"order_item_id"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"requestType","kind":"enum","type":"ReturnRequestType","dbName":"request_type"},{"name":"requestedVariantId","kind":"scalar","type":"String","dbName":"requested_variant_id"},{"name":"reason","kind":"scalar","type":"String"},{"name":"reasonCode","kind":"scalar","type":"String","dbName":"reason_code"},{"name":"evidenceImages","kind":"scalar","type":"Json","dbName":"evidence_images"},{"name":"bankAccountName","kind":"scalar","type":"String","dbName":"bank_account_name"},{"name":"bankAccountNumber","kind":"scalar","type":"String","dbName":"bank_account_number"},{"name":"bankName","kind":"scalar","type":"String","dbName":"bank_name"},{"name":"status","kind":"enum","type":"ReturnStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"orderItem","kind":"object","type":"OrderItem","relationName":"OrderItemToReturn"}],"dbName":"returns"},"OrderStatusHistory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"oldStatus","kind":"enum","type":"OrderStatus","dbName":"old_status"},{"name":"newStatus","kind":"enum","type":"OrderStatus","dbName":"new_status"},{"name":"changedBy","kind":"scalar","type":"String","dbName":"changed_by"},{"name":"reason","kind":"scalar","type":"String"},{"name":"changedAt","kind":"scalar","type":"DateTime","dbName":"changed_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderStatusHistory"}],"dbName":"order_status_history"},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"content","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean","dbName":"is_read"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":"notifications"},"UserActivityLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"action","kind":"scalar","type":"String"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"UserToUserActivityLog"}],"dbName":"user_activity_logs"},"DiscountIncludedCategory":{"fields":[{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"categoryId","kind":"scalar","type":"String","dbName":"category_id"},{"name":"discount","kind":"object","type":"Discount","relationName":"DiscountToDiscountIncludedCategory"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToDiscountIncludedCategory"}],"dbName":"discount_included_categories"},"DiscountExcludedCategory":{"fields":[{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"categoryId","kind":"scalar","type":"String","dbName":"category_id"},{"name":"discount","kind":"object","type":"Discount","relationName":"DiscountToDiscountExcludedCategory"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToDiscountExcludedCategory"}],"dbName":"discount_excluded_categories"},"DiscountIncludedProduct":{"fields":[{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"discount","kind":"object","type":"Discount","relationName":"DiscountToDiscountIncludedProduct"},{"name":"product","kind":"object","type":"Product","relationName":"DiscountIncludedProductToProduct"}],"dbName":"discount_included_products"},"DiscountExcludedProduct":{"fields":[{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"discount","kind":"object","type":"Discount","relationName":"DiscountToDiscountExcludedProduct"},{"name":"product","kind":"object","type":"Product","relationName":"DiscountExcludedProductToProduct"}],"dbName":"discount_excluded_products"},"DiscountMemberTier":{"fields":[{"name":"discountId","kind":"scalar","type":"String","dbName":"discount_id"},{"name":"tier","kind":"scalar","type":"String"},{"name":"discount","kind":"object","type":"Discount","relationName":"DiscountToDiscountMemberTier"}],"dbName":"discount_member_tiers"},"ChatSession":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"status","kind":"enum","type":"ChatSessionStatus"},{"name":"channel","kind":"scalar","type":"String"},{"name":"guestToken","kind":"scalar","type":"String","dbName":"guest_token"},{"name":"leadName","kind":"scalar","type":"String","dbName":"lead_name"},{"name":"leadPhone","kind":"scalar","type":"String","dbName":"lead_phone"},{"name":"leadEmail","kind":"scalar","type":"String","dbName":"lead_email"},{"name":"budgetMin","kind":"scalar","type":"Decimal","dbName":"budget_min"},{"name":"budgetMax","kind":"scalar","type":"Decimal","dbName":"budget_max"},{"name":"shopperProfile","kind":"scalar","type":"Json","dbName":"shopper_profile"},{"name":"lastIntent","kind":"scalar","type":"String","dbName":"last_intent"},{"name":"lastSummary","kind":"scalar","type":"String","dbName":"last_summary"},{"name":"lastSuggestedProductIds","kind":"scalar","type":"Json","dbName":"last_suggested_product_ids"},{"name":"lastMessageAt","kind":"scalar","type":"DateTime","dbName":"last_message_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"user","kind":"object","type":"User","relationName":"ChatSessionToUser"},{"name":"messages","kind":"object","type":"ChatMessage","relationName":"ChatMessageToChatSession"}],"dbName":"chat_sessions"},"ChatMessage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"sessionId","kind":"scalar","type":"String","dbName":"session_id"},{"name":"role","kind":"enum","type":"ChatMessageRole"},{"name":"content","kind":"scalar","type":"String"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"session","kind":"object","type":"ChatSession","relationName":"ChatMessageToChatSession"}],"dbName":"chat_messages"},"RecommendationEvent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventType","kind":"enum","type":"RecommendationEventType","dbName":"event_type"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"sessionId","kind":"scalar","type":"String","dbName":"session_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"searchQuery","kind":"scalar","type":"String","dbName":"search_query"},{"name":"dedupeKey","kind":"scalar","type":"String","dbName":"dedupe_key"},{"name":"source","kind":"scalar","type":"String"},{"name":"placement","kind":"scalar","type":"String"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"occurredAt","kind":"scalar","type":"DateTime","dbName":"occurred_at"},{"name":"processedAt","kind":"scalar","type":"DateTime","dbName":"processed_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"RecommendationEventToUser"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToRecommendationEvent"}],"dbName":"recommendation_events"},"ProductSimilarity":{"fields":[{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"relatedProductId","kind":"scalar","type":"String","dbName":"related_product_id"},{"name":"algorithm","kind":"scalar","type":"String"},{"name":"score","kind":"scalar","type":"Decimal"},{"name":"rank","kind":"scalar","type":"Int"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"product","kind":"object","type":"Product","relationName":"ProductSimilaritySource"},{"name":"relatedProduct","kind":"object","type":"Product","relationName":"ProductSimilarityTarget"}],"dbName":"product_similarities"},"RecommendationCache":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"cacheKey","kind":"scalar","type":"String","dbName":"cache_key"},{"name":"modelKind","kind":"enum","type":"RecommendationModelKind","dbName":"model_kind"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"sessionId","kind":"scalar","type":"String","dbName":"session_id"},{"name":"itemsJson","kind":"scalar","type":"Json","dbName":"items_json"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"expiresAt","kind":"scalar","type":"DateTime","dbName":"expires_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"user","kind":"object","type":"User","relationName":"RecommendationCacheToUser"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToRecommendationCache"}],"dbName":"recommendation_caches"},"ProductEmbedding":{"fields":[{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"embedding","kind":"scalar","type":"Json"},{"name":"embeddingText","kind":"scalar","type":"String","dbName":"embedding_text"},{"name":"modelVersion","kind":"scalar","type":"String","dbName":"model_version"},{"name":"dimensions","kind":"scalar","type":"Int"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductEmbedding"}],"dbName":"product_embeddings"},"UserEmbedding":{"fields":[{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"embedding","kind":"scalar","type":"Json"},{"name":"modelVersion","kind":"scalar","type":"String","dbName":"model_version"},{"name":"dimensions","kind":"scalar","type":"Int"},{"name":"lastEventAt","kind":"scalar","type":"DateTime","dbName":"last_event_at"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"user","kind":"object","type":"User","relationName":"UserToUserEmbedding"}],"dbName":"user_embeddings"},"RecommendationExperiment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"key","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"traffic","kind":"scalar","type":"Int"},{"name":"variants","kind":"scalar","type":"Json"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"startAt","kind":"scalar","type":"DateTime","dbName":"start_at"},{"name":"endAt","kind":"scalar","type":"DateTime","dbName":"end_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"}],"dbName":"recommendation_experiments"},"RecommendationMetricSnapshot":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"metricDate","kind":"scalar","type":"DateTime","dbName":"metric_date"},{"name":"metricName","kind":"scalar","type":"String","dbName":"metric_name"},{"name":"metricValue","kind":"scalar","type":"Decimal","dbName":"metric_value"},{"name":"dimensions","kind":"scalar","type":"Json"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"}],"dbName":"recommendation_metric_snapshots"},"VirtualTryOnRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"productImageUrl","kind":"scalar","type":"String","dbName":"product_image_url"},{"name":"humanImageUrl","kind":"scalar","type":"String","dbName":"human_image_url"},{"name":"outputImageUrl","kind":"scalar","type":"String","dbName":"output_image_url"},{"name":"outputPublicId","kind":"scalar","type":"String","dbName":"output_public_id"},{"name":"provider","kind":"scalar","type":"String"},{"name":"modelName","kind":"scalar","type":"String","dbName":"model_name"},{"name":"providerJobId","kind":"scalar","type":"String","dbName":"provider_job_id"},{"name":"status","kind":"enum","type":"VirtualTryOnStatus"},{"name":"category","kind":"scalar","type":"String"},{"name":"garmentDes","kind":"scalar","type":"String","dbName":"garment_des"},{"name":"crop","kind":"scalar","type":"Boolean"},{"name":"forceDc","kind":"scalar","type":"Boolean","dbName":"force_dc"},{"name":"maskOnly","kind":"scalar","type":"Boolean","dbName":"mask_only"},{"name":"steps","kind":"scalar","type":"Int"},{"name":"seed","kind":"scalar","type":"Int"},{"name":"latencyMs","kind":"scalar","type":"Int","dbName":"latency_ms"},{"name":"estimatedCostUsd","kind":"scalar","type":"Decimal","dbName":"estimated_cost_usd"},{"name":"errorCode","kind":"scalar","type":"String","dbName":"error_code"},{"name":"errorMessage","kind":"scalar","type":"String","dbName":"error_message"},{"name":"startedAt","kind":"scalar","type":"DateTime","dbName":"started_at"},{"name":"completedAt","kind":"scalar","type":"DateTime","dbName":"completed_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"user","kind":"object","type":"User","relationName":"UserToVirtualTryOnRequest"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToVirtualTryOnRequest"}],"dbName":"virtual_try_on_requests"},"Wishlist":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"UserToWishlist"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToWishlist"}],"dbName":"wishlists"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"orderItemId","kind":"scalar","type":"String","dbName":"order_item_id"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToReview"},{"name":"orderItem","kind":"object","type":"OrderItem","relationName":"OrderItemReviews"},{"name":"images","kind":"object","type":"ReviewImage","relationName":"ReviewToReviewImage"}],"dbName":"reviews"},"ReviewImage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"reviewId","kind":"scalar","type":"String","dbName":"review_id"},{"name":"url","kind":"scalar","type":"String"},{"name":"publicId","kind":"scalar","type":"String","dbName":"public_id"},{"name":"sortOrder","kind":"scalar","type":"Int","dbName":"sort_order"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"review","kind":"object","type":"Review","relationName":"ReviewToReviewImage"}],"dbName":"review_images"},"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"actorType","kind":"enum","type":"ActorType","dbName":"actor_type"},{"name":"actorId","kind":"scalar","type":"String","dbName":"actor_id"},{"name":"targetType","kind":"scalar","type":"String","dbName":"target_type"},{"name":"targetId","kind":"scalar","type":"String","dbName":"target_id"},{"name":"action","kind":"scalar","type":"String"},{"name":"oldData","kind":"scalar","type":"Json","dbName":"old_data"},{"name":"newData","kind":"scalar","type":"Json","dbName":"new_data"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"}],"dbName":"audit_logs"},"RefundTransaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"type","kind":"enum","type":"RefundType"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"RefundStatus"},{"name":"provider","kind":"scalar","type":"String"},{"name":"providerRefundId","kind":"scalar","type":"String","dbName":"provider_refund_id"},{"name":"reason","kind":"scalar","type":"String"},{"name":"initiatedBy","kind":"enum","type":"ActorType","dbName":"initiated_by"},{"name":"idempotencyKey","kind":"scalar","type":"String","dbName":"idempotency_key"},{"name":"failureReason","kind":"scalar","type":"String","dbName":"failure_reason"},{"name":"retryCount","kind":"scalar","type":"Int","dbName":"retry_count"},{"name":"requestedAt","kind":"scalar","type":"DateTime","dbName":"requested_at"},{"name":"processedAt","kind":"scalar","type":"DateTime","dbName":"processed_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToRefundTransaction"}],"dbName":"refund_transactions"},"OrderCancelRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"reasonCode","kind":"enum","type":"CancelReason","dbName":"reason_code"},{"name":"reasonText","kind":"scalar","type":"String","dbName":"reason_text"},{"name":"status","kind":"enum","type":"CancelRequestStatus"},{"name":"requestedByUserId","kind":"scalar","type":"String","dbName":"requested_by_user_id"},{"name":"approvedByAdminId","kind":"scalar","type":"String","dbName":"approved_by_admin_id"},{"name":"rejectedByAdminId","kind":"scalar","type":"String","dbName":"rejected_by_admin_id"},{"name":"approvedAt","kind":"scalar","type":"DateTime","dbName":"approved_at"},{"name":"rejectedAt","kind":"scalar","type":"DateTime","dbName":"rejected_at"},{"name":"completedAt","kind":"scalar","type":"DateTime","dbName":"completed_at"},{"name":"rejectionReason","kind":"scalar","type":"String","dbName":"rejection_reason"},{"name":"bankAccountName","kind":"scalar","type":"String","dbName":"bank_account_name"},{"name":"bankAccountNumber","kind":"scalar","type":"String","dbName":"bank_account_number"},{"name":"bankName","kind":"scalar","type":"String","dbName":"bank_name"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderCancelRequest"}],"dbName":"order_cancel_requests"},"LoyaltyAccount":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"balance","kind":"scalar","type":"Int"},{"name":"tier","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"user","kind":"object","type":"User","relationName":"LoyaltyAccountToUser"},{"name":"transactions","kind":"object","type":"LoyaltyTransaction","relationName":"LoyaltyAccountToLoyaltyTransaction"}],"dbName":"loyalty_accounts"},"LoyaltyTransaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String","dbName":"account_id"},{"name":"type","kind":"enum","type":"LoyaltyTransactionType"},{"name":"points","kind":"scalar","type":"Int"},{"name":"balanceAfter","kind":"scalar","type":"Int","dbName":"balance_after"},{"name":"referenceType","kind":"scalar","type":"String","dbName":"reference_type"},{"name":"referenceId","kind":"scalar","type":"String","dbName":"reference_id"},{"name":"idempotencyKey","kind":"scalar","type":"String","dbName":"idempotency_key"},{"name":"description","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime","dbName":"expires_at"},{"name":"expiredAt","kind":"scalar","type":"DateTime","dbName":"expired_at"},{"name":"sourcePoints","kind":"scalar","type":"Int","dbName":"source_points"},{"name":"sourceTransactionId","kind":"scalar","type":"String","dbName":"source_transaction_id"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"account","kind":"object","type":"LoyaltyAccount","relationName":"LoyaltyAccountToLoyaltyTransaction"}],"dbName":"loyalty_transactions"},"LoyaltyConfig":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"spendPerPoint","kind":"scalar","type":"Int","dbName":"spend_per_point"},{"name":"pointValidityDays","kind":"scalar","type":"Int","dbName":"point_validity_days"},{"name":"silverMinPoints","kind":"scalar","type":"Int","dbName":"silver_min_points"},{"name":"goldMinPoints","kind":"scalar","type":"Int","dbName":"gold_min_points"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"}],"dbName":"loyalty_config"},"Promotion":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"subtitle","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"bannerImageUrl","kind":"scalar","type":"String","dbName":"banner_image_url"},{"name":"mobileBannerImageUrl","kind":"scalar","type":"String","dbName":"mobile_banner_image_url"},{"name":"campaignType","kind":"enum","type":"PromotionCampaignType","dbName":"campaign_type"},{"name":"type","kind":"enum","type":"PromotionType"},{"name":"status","kind":"enum","type":"PromotionStatus"},{"name":"scopeType","kind":"enum","type":"PromotionScopeType","dbName":"scope_type"},{"name":"includeDescendants","kind":"scalar","type":"Boolean","dbName":"include_descendants"},{"name":"value","kind":"scalar","type":"Decimal"},{"name":"maxDiscount","kind":"scalar","type":"Decimal","dbName":"max_discount"},{"name":"priority","kind":"scalar","type":"Int"},{"name":"displayPriority","kind":"scalar","type":"Int","dbName":"display_priority"},{"name":"isFeatured","kind":"scalar","type":"Boolean","dbName":"is_featured"},{"name":"ctaLabel","kind":"scalar","type":"String","dbName":"cta_label"},{"name":"ctaUrl","kind":"scalar","type":"String","dbName":"cta_url"},{"name":"memberTiers","kind":"scalar","type":"Json","dbName":"member_tiers"},{"name":"usageLimit","kind":"scalar","type":"Int","dbName":"usage_limit"},{"name":"usedCount","kind":"scalar","type":"Int","dbName":"used_count"},{"name":"stackableWithVoucher","kind":"scalar","type":"Boolean","dbName":"stackable_with_voucher"},{"name":"startAt","kind":"scalar","type":"DateTime","dbName":"start_at"},{"name":"endAt","kind":"scalar","type":"DateTime","dbName":"end_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"includedCategories","kind":"object","type":"PromotionIncludedCategory","relationName":"PromotionToPromotionIncludedCategory"},{"name":"includedProducts","kind":"object","type":"PromotionIncludedProduct","relationName":"PromotionToPromotionIncludedProduct"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"OrderItemToPromotion"},{"name":"usages","kind":"object","type":"PromotionUsage","relationName":"PromotionToPromotionUsage"}],"dbName":"promotions"},"PromotionIncludedCategory":{"fields":[{"name":"promotionId","kind":"scalar","type":"String","dbName":"promotion_id"},{"name":"categoryId","kind":"scalar","type":"String","dbName":"category_id"},{"name":"promotion","kind":"object","type":"Promotion","relationName":"PromotionToPromotionIncludedCategory"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToPromotionIncludedCategory"}],"dbName":"promotion_included_categories"},"PromotionIncludedProduct":{"fields":[{"name":"promotionId","kind":"scalar","type":"String","dbName":"promotion_id"},{"name":"productId","kind":"scalar","type":"String","dbName":"product_id"},{"name":"promotion","kind":"object","type":"Promotion","relationName":"PromotionToPromotionIncludedProduct"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToPromotionIncludedProduct"}],"dbName":"promotion_included_products"},"PromotionUsage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"promotionId","kind":"scalar","type":"String","dbName":"promotion_id"},{"name":"orderId","kind":"scalar","type":"String","dbName":"order_id"},{"name":"discountAmount","kind":"scalar","type":"Decimal","dbName":"discount_amount"},{"name":"idempotencyKey","kind":"scalar","type":"String","dbName":"idempotency_key"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"promotion","kind":"object","type":"Promotion","relationName":"PromotionToPromotionUsage"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToPromotionUsage"}],"dbName":"promotion_usages"},"PhysicalSale":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"cashierId","kind":"scalar","type":"String","dbName":"cashier_id"},{"name":"paymentMethod","kind":"scalar","type":"String","dbName":"payment_method"},{"name":"totalAmount","kind":"scalar","type":"Decimal","dbName":"total_amount"},{"name":"code","kind":"scalar","type":"String"},{"name":"idempotencyKey","kind":"scalar","type":"String","dbName":"idempotency_key"},{"name":"status","kind":"enum","type":"PhysicalSaleStatus"},{"name":"customerId","kind":"scalar","type":"String","dbName":"customer_id"},{"name":"customerName","kind":"scalar","type":"String","dbName":"customer_name"},{"name":"customerPhone","kind":"scalar","type":"String","dbName":"customer_phone"},{"name":"paidAt","kind":"scalar","type":"DateTime","dbName":"paid_at"},{"name":"cancelledAt","kind":"scalar","type":"DateTime","dbName":"cancelled_at"},{"name":"cancelledBy","kind":"scalar","type":"String","dbName":"cancelled_by"},{"name":"cancelReason","kind":"scalar","type":"String","dbName":"cancel_reason"},{"name":"note","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"items","kind":"object","type":"PhysicalSaleItem","relationName":"PhysicalSaleToPhysicalSaleItem"}],"dbName":"physical_sales"},"PhysicalSaleItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"saleId","kind":"scalar","type":"String","dbName":"sale_id"},{"name":"variantId","kind":"scalar","type":"String","dbName":"variant_id"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Decimal","dbName":"unit_price"},{"name":"productName","kind":"scalar","type":"String","dbName":"product_name"},{"name":"sku","kind":"scalar","type":"String"},{"name":"variantAttributes","kind":"scalar","type":"Json","dbName":"variant_attributes"},{"name":"imageUrl","kind":"scalar","type":"String","dbName":"image_url"},{"name":"lineTotal","kind":"scalar","type":"Decimal","dbName":"line_total"},{"name":"sale","kind":"object","type":"PhysicalSale","relationName":"PhysicalSaleToPhysicalSaleItem"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"PhysicalSaleItemToProductVariant"}],"dbName":"physical_sale_items"}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.mysql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.mysql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AnyNull: () => AnyNull2,
  AttributeDefinitionOrderByRelevanceFieldEnum: () => AttributeDefinitionOrderByRelevanceFieldEnum,
  AttributeDefinitionScalarFieldEnum: () => AttributeDefinitionScalarFieldEnum,
  AttributeOptionOrderByRelevanceFieldEnum: () => AttributeOptionOrderByRelevanceFieldEnum,
  AttributeOptionScalarFieldEnum: () => AttributeOptionScalarFieldEnum,
  AuditLogOrderByRelevanceFieldEnum: () => AuditLogOrderByRelevanceFieldEnum,
  AuditLogScalarFieldEnum: () => AuditLogScalarFieldEnum,
  BannerOrderByRelevanceFieldEnum: () => BannerOrderByRelevanceFieldEnum,
  BannerScalarFieldEnum: () => BannerScalarFieldEnum,
  BirthdayVoucherGrantOrderByRelevanceFieldEnum: () => BirthdayVoucherGrantOrderByRelevanceFieldEnum,
  BirthdayVoucherGrantScalarFieldEnum: () => BirthdayVoucherGrantScalarFieldEnum,
  CartItemOrderByRelevanceFieldEnum: () => CartItemOrderByRelevanceFieldEnum,
  CartItemScalarFieldEnum: () => CartItemScalarFieldEnum,
  CartOrderByRelevanceFieldEnum: () => CartOrderByRelevanceFieldEnum,
  CartScalarFieldEnum: () => CartScalarFieldEnum,
  CategoryOrderByRelevanceFieldEnum: () => CategoryOrderByRelevanceFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  ChatMessageOrderByRelevanceFieldEnum: () => ChatMessageOrderByRelevanceFieldEnum,
  ChatMessageScalarFieldEnum: () => ChatMessageScalarFieldEnum,
  ChatSessionOrderByRelevanceFieldEnum: () => ChatSessionOrderByRelevanceFieldEnum,
  ChatSessionScalarFieldEnum: () => ChatSessionScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  DiscountExcludedCategoryOrderByRelevanceFieldEnum: () => DiscountExcludedCategoryOrderByRelevanceFieldEnum,
  DiscountExcludedCategoryScalarFieldEnum: () => DiscountExcludedCategoryScalarFieldEnum,
  DiscountExcludedProductOrderByRelevanceFieldEnum: () => DiscountExcludedProductOrderByRelevanceFieldEnum,
  DiscountExcludedProductScalarFieldEnum: () => DiscountExcludedProductScalarFieldEnum,
  DiscountIncludedCategoryOrderByRelevanceFieldEnum: () => DiscountIncludedCategoryOrderByRelevanceFieldEnum,
  DiscountIncludedCategoryScalarFieldEnum: () => DiscountIncludedCategoryScalarFieldEnum,
  DiscountIncludedProductOrderByRelevanceFieldEnum: () => DiscountIncludedProductOrderByRelevanceFieldEnum,
  DiscountIncludedProductScalarFieldEnum: () => DiscountIncludedProductScalarFieldEnum,
  DiscountMemberTierOrderByRelevanceFieldEnum: () => DiscountMemberTierOrderByRelevanceFieldEnum,
  DiscountMemberTierScalarFieldEnum: () => DiscountMemberTierScalarFieldEnum,
  DiscountOrderByRelevanceFieldEnum: () => DiscountOrderByRelevanceFieldEnum,
  DiscountScalarFieldEnum: () => DiscountScalarFieldEnum,
  DiscountUsageOrderByRelevanceFieldEnum: () => DiscountUsageOrderByRelevanceFieldEnum,
  DiscountUsageScalarFieldEnum: () => DiscountUsageScalarFieldEnum,
  EmailVerificationTokenOrderByRelevanceFieldEnum: () => EmailVerificationTokenOrderByRelevanceFieldEnum,
  EmailVerificationTokenScalarFieldEnum: () => EmailVerificationTokenScalarFieldEnum,
  InventoryLogOrderByRelevanceFieldEnum: () => InventoryLogOrderByRelevanceFieldEnum,
  InventoryLogScalarFieldEnum: () => InventoryLogScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  JsonNullValueInput: () => JsonNullValueInput,
  LoyaltyAccountOrderByRelevanceFieldEnum: () => LoyaltyAccountOrderByRelevanceFieldEnum,
  LoyaltyAccountScalarFieldEnum: () => LoyaltyAccountScalarFieldEnum,
  LoyaltyConfigScalarFieldEnum: () => LoyaltyConfigScalarFieldEnum,
  LoyaltyTransactionOrderByRelevanceFieldEnum: () => LoyaltyTransactionOrderByRelevanceFieldEnum,
  LoyaltyTransactionScalarFieldEnum: () => LoyaltyTransactionScalarFieldEnum,
  ModelName: () => ModelName,
  NotificationOrderByRelevanceFieldEnum: () => NotificationOrderByRelevanceFieldEnum,
  NotificationScalarFieldEnum: () => NotificationScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  OAuthAccountOrderByRelevanceFieldEnum: () => OAuthAccountOrderByRelevanceFieldEnum,
  OAuthAccountScalarFieldEnum: () => OAuthAccountScalarFieldEnum,
  OrderCancelRequestOrderByRelevanceFieldEnum: () => OrderCancelRequestOrderByRelevanceFieldEnum,
  OrderCancelRequestScalarFieldEnum: () => OrderCancelRequestScalarFieldEnum,
  OrderItemOrderByRelevanceFieldEnum: () => OrderItemOrderByRelevanceFieldEnum,
  OrderItemScalarFieldEnum: () => OrderItemScalarFieldEnum,
  OrderOrderByRelevanceFieldEnum: () => OrderOrderByRelevanceFieldEnum,
  OrderScalarFieldEnum: () => OrderScalarFieldEnum,
  OrderShipmentOrderByRelevanceFieldEnum: () => OrderShipmentOrderByRelevanceFieldEnum,
  OrderShipmentScalarFieldEnum: () => OrderShipmentScalarFieldEnum,
  OrderShippingAddressOrderByRelevanceFieldEnum: () => OrderShippingAddressOrderByRelevanceFieldEnum,
  OrderShippingAddressScalarFieldEnum: () => OrderShippingAddressScalarFieldEnum,
  OrderStatusHistoryOrderByRelevanceFieldEnum: () => OrderStatusHistoryOrderByRelevanceFieldEnum,
  OrderStatusHistoryScalarFieldEnum: () => OrderStatusHistoryScalarFieldEnum,
  PasswordResetTokenOrderByRelevanceFieldEnum: () => PasswordResetTokenOrderByRelevanceFieldEnum,
  PasswordResetTokenScalarFieldEnum: () => PasswordResetTokenScalarFieldEnum,
  PaymentOrderByRelevanceFieldEnum: () => PaymentOrderByRelevanceFieldEnum,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PaymentTransactionOrderByRelevanceFieldEnum: () => PaymentTransactionOrderByRelevanceFieldEnum,
  PaymentTransactionScalarFieldEnum: () => PaymentTransactionScalarFieldEnum,
  PhysicalSaleItemOrderByRelevanceFieldEnum: () => PhysicalSaleItemOrderByRelevanceFieldEnum,
  PhysicalSaleItemScalarFieldEnum: () => PhysicalSaleItemScalarFieldEnum,
  PhysicalSaleOrderByRelevanceFieldEnum: () => PhysicalSaleOrderByRelevanceFieldEnum,
  PhysicalSaleScalarFieldEnum: () => PhysicalSaleScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  ProductAttributeValueOptionOrderByRelevanceFieldEnum: () => ProductAttributeValueOptionOrderByRelevanceFieldEnum,
  ProductAttributeValueOptionScalarFieldEnum: () => ProductAttributeValueOptionScalarFieldEnum,
  ProductAttributeValueOrderByRelevanceFieldEnum: () => ProductAttributeValueOrderByRelevanceFieldEnum,
  ProductAttributeValueScalarFieldEnum: () => ProductAttributeValueScalarFieldEnum,
  ProductCategoryOrderByRelevanceFieldEnum: () => ProductCategoryOrderByRelevanceFieldEnum,
  ProductCategoryScalarFieldEnum: () => ProductCategoryScalarFieldEnum,
  ProductEmbeddingOrderByRelevanceFieldEnum: () => ProductEmbeddingOrderByRelevanceFieldEnum,
  ProductEmbeddingScalarFieldEnum: () => ProductEmbeddingScalarFieldEnum,
  ProductImageOrderByRelevanceFieldEnum: () => ProductImageOrderByRelevanceFieldEnum,
  ProductImageScalarFieldEnum: () => ProductImageScalarFieldEnum,
  ProductOrderByRelevanceFieldEnum: () => ProductOrderByRelevanceFieldEnum,
  ProductPriceHistoryOrderByRelevanceFieldEnum: () => ProductPriceHistoryOrderByRelevanceFieldEnum,
  ProductPriceHistoryScalarFieldEnum: () => ProductPriceHistoryScalarFieldEnum,
  ProductScalarFieldEnum: () => ProductScalarFieldEnum,
  ProductSimilarityOrderByRelevanceFieldEnum: () => ProductSimilarityOrderByRelevanceFieldEnum,
  ProductSimilarityScalarFieldEnum: () => ProductSimilarityScalarFieldEnum,
  ProductTagOrderByRelevanceFieldEnum: () => ProductTagOrderByRelevanceFieldEnum,
  ProductTagScalarFieldEnum: () => ProductTagScalarFieldEnum,
  ProductTypeAttributeOrderByRelevanceFieldEnum: () => ProductTypeAttributeOrderByRelevanceFieldEnum,
  ProductTypeAttributeScalarFieldEnum: () => ProductTypeAttributeScalarFieldEnum,
  ProductTypeOrderByRelevanceFieldEnum: () => ProductTypeOrderByRelevanceFieldEnum,
  ProductTypeScalarFieldEnum: () => ProductTypeScalarFieldEnum,
  ProductVariantOrderByRelevanceFieldEnum: () => ProductVariantOrderByRelevanceFieldEnum,
  ProductVariantScalarFieldEnum: () => ProductVariantScalarFieldEnum,
  PromotionIncludedCategoryOrderByRelevanceFieldEnum: () => PromotionIncludedCategoryOrderByRelevanceFieldEnum,
  PromotionIncludedCategoryScalarFieldEnum: () => PromotionIncludedCategoryScalarFieldEnum,
  PromotionIncludedProductOrderByRelevanceFieldEnum: () => PromotionIncludedProductOrderByRelevanceFieldEnum,
  PromotionIncludedProductScalarFieldEnum: () => PromotionIncludedProductScalarFieldEnum,
  PromotionOrderByRelevanceFieldEnum: () => PromotionOrderByRelevanceFieldEnum,
  PromotionScalarFieldEnum: () => PromotionScalarFieldEnum,
  PromotionUsageOrderByRelevanceFieldEnum: () => PromotionUsageOrderByRelevanceFieldEnum,
  PromotionUsageScalarFieldEnum: () => PromotionUsageScalarFieldEnum,
  QueryMode: () => QueryMode,
  RecommendationCacheOrderByRelevanceFieldEnum: () => RecommendationCacheOrderByRelevanceFieldEnum,
  RecommendationCacheScalarFieldEnum: () => RecommendationCacheScalarFieldEnum,
  RecommendationEventOrderByRelevanceFieldEnum: () => RecommendationEventOrderByRelevanceFieldEnum,
  RecommendationEventScalarFieldEnum: () => RecommendationEventScalarFieldEnum,
  RecommendationExperimentOrderByRelevanceFieldEnum: () => RecommendationExperimentOrderByRelevanceFieldEnum,
  RecommendationExperimentScalarFieldEnum: () => RecommendationExperimentScalarFieldEnum,
  RecommendationMetricSnapshotOrderByRelevanceFieldEnum: () => RecommendationMetricSnapshotOrderByRelevanceFieldEnum,
  RecommendationMetricSnapshotScalarFieldEnum: () => RecommendationMetricSnapshotScalarFieldEnum,
  RefreshTokenOrderByRelevanceFieldEnum: () => RefreshTokenOrderByRelevanceFieldEnum,
  RefreshTokenScalarFieldEnum: () => RefreshTokenScalarFieldEnum,
  RefundTransactionOrderByRelevanceFieldEnum: () => RefundTransactionOrderByRelevanceFieldEnum,
  RefundTransactionScalarFieldEnum: () => RefundTransactionScalarFieldEnum,
  ReturnOrderByRelevanceFieldEnum: () => ReturnOrderByRelevanceFieldEnum,
  ReturnScalarFieldEnum: () => ReturnScalarFieldEnum,
  ReturnShipmentOrderByRelevanceFieldEnum: () => ReturnShipmentOrderByRelevanceFieldEnum,
  ReturnShipmentScalarFieldEnum: () => ReturnShipmentScalarFieldEnum,
  ReviewImageOrderByRelevanceFieldEnum: () => ReviewImageOrderByRelevanceFieldEnum,
  ReviewImageScalarFieldEnum: () => ReviewImageScalarFieldEnum,
  ReviewOrderByRelevanceFieldEnum: () => ReviewOrderByRelevanceFieldEnum,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  RoleOrderByRelevanceFieldEnum: () => RoleOrderByRelevanceFieldEnum,
  RoleScalarFieldEnum: () => RoleScalarFieldEnum,
  SizeChartRuleOrderByRelevanceFieldEnum: () => SizeChartRuleOrderByRelevanceFieldEnum,
  SizeChartRuleScalarFieldEnum: () => SizeChartRuleScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TagOrderByRelevanceFieldEnum: () => TagOrderByRelevanceFieldEnum,
  TagScalarFieldEnum: () => TagScalarFieldEnum,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserActivityLogOrderByRelevanceFieldEnum: () => UserActivityLogOrderByRelevanceFieldEnum,
  UserActivityLogScalarFieldEnum: () => UserActivityLogScalarFieldEnum,
  UserAddressOrderByRelevanceFieldEnum: () => UserAddressOrderByRelevanceFieldEnum,
  UserAddressScalarFieldEnum: () => UserAddressScalarFieldEnum,
  UserEmbeddingOrderByRelevanceFieldEnum: () => UserEmbeddingOrderByRelevanceFieldEnum,
  UserEmbeddingScalarFieldEnum: () => UserEmbeddingScalarFieldEnum,
  UserOrderByRelevanceFieldEnum: () => UserOrderByRelevanceFieldEnum,
  UserRoleOrderByRelevanceFieldEnum: () => UserRoleOrderByRelevanceFieldEnum,
  UserRoleScalarFieldEnum: () => UserRoleScalarFieldEnum,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VariantAttributeValueOrderByRelevanceFieldEnum: () => VariantAttributeValueOrderByRelevanceFieldEnum,
  VariantAttributeValueScalarFieldEnum: () => VariantAttributeValueScalarFieldEnum,
  VirtualTryOnRequestOrderByRelevanceFieldEnum: () => VirtualTryOnRequestOrderByRelevanceFieldEnum,
  VirtualTryOnRequestScalarFieldEnum: () => VirtualTryOnRequestScalarFieldEnum,
  WishlistOrderByRelevanceFieldEnum: () => WishlistOrderByRelevanceFieldEnum,
  WishlistScalarFieldEnum: () => WishlistScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.3.0",
  engine: "9d6ad21cbbceab97458517b147a6a09ff43aa735"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  RefreshToken: "RefreshToken",
  EmailVerificationToken: "EmailVerificationToken",
  PasswordResetToken: "PasswordResetToken",
  OAuthAccount: "OAuthAccount",
  Role: "Role",
  UserRole: "UserRole",
  UserAddress: "UserAddress",
  Product: "Product",
  ProductVariant: "ProductVariant",
  ProductImage: "ProductImage",
  Category: "Category",
  ProductCategory: "ProductCategory",
  ProductType: "ProductType",
  SizeChartRule: "SizeChartRule",
  AttributeDefinition: "AttributeDefinition",
  AttributeOption: "AttributeOption",
  ProductTypeAttribute: "ProductTypeAttribute",
  ProductAttributeValue: "ProductAttributeValue",
  ProductAttributeValueOption: "ProductAttributeValueOption",
  VariantAttributeValue: "VariantAttributeValue",
  Tag: "Tag",
  ProductTag: "ProductTag",
  Cart: "Cart",
  CartItem: "CartItem",
  Order: "Order",
  OrderShippingAddress: "OrderShippingAddress",
  OrderShipment: "OrderShipment",
  ReturnShipment: "ReturnShipment",
  OrderItem: "OrderItem",
  Payment: "Payment",
  PaymentTransaction: "PaymentTransaction",
  ProductPriceHistory: "ProductPriceHistory",
  Discount: "Discount",
  Banner: "Banner",
  DiscountUsage: "DiscountUsage",
  BirthdayVoucherGrant: "BirthdayVoucherGrant",
  InventoryLog: "InventoryLog",
  Return: "Return",
  OrderStatusHistory: "OrderStatusHistory",
  Notification: "Notification",
  UserActivityLog: "UserActivityLog",
  DiscountIncludedCategory: "DiscountIncludedCategory",
  DiscountExcludedCategory: "DiscountExcludedCategory",
  DiscountIncludedProduct: "DiscountIncludedProduct",
  DiscountExcludedProduct: "DiscountExcludedProduct",
  DiscountMemberTier: "DiscountMemberTier",
  ChatSession: "ChatSession",
  ChatMessage: "ChatMessage",
  RecommendationEvent: "RecommendationEvent",
  ProductSimilarity: "ProductSimilarity",
  RecommendationCache: "RecommendationCache",
  ProductEmbedding: "ProductEmbedding",
  UserEmbedding: "UserEmbedding",
  RecommendationExperiment: "RecommendationExperiment",
  RecommendationMetricSnapshot: "RecommendationMetricSnapshot",
  VirtualTryOnRequest: "VirtualTryOnRequest",
  Wishlist: "Wishlist",
  Review: "Review",
  ReviewImage: "ReviewImage",
  AuditLog: "AuditLog",
  RefundTransaction: "RefundTransaction",
  OrderCancelRequest: "OrderCancelRequest",
  LoyaltyAccount: "LoyaltyAccount",
  LoyaltyTransaction: "LoyaltyTransaction",
  LoyaltyConfig: "LoyaltyConfig",
  Promotion: "Promotion",
  PromotionIncludedCategory: "PromotionIncludedCategory",
  PromotionIncludedProduct: "PromotionIncludedProduct",
  PromotionUsage: "PromotionUsage",
  PhysicalSale: "PhysicalSale",
  PhysicalSaleItem: "PhysicalSaleItem"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  email: "email",
  phone: "phone",
  passwordHash: "passwordHash",
  emailVerified: "emailVerified",
  status: "status",
  lastLogin: "lastLogin",
  age: "age",
  birthday: "birthday",
  heightCm: "heightCm",
  weightKg: "weightKg",
  bodyProfileUpdatedAt: "bodyProfileUpdatedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var RefreshTokenScalarFieldEnum = {
  id: "id",
  userId: "userId",
  token: "token",
  deviceInfo: "deviceInfo",
  expiresAt: "expiresAt",
  revoked: "revoked",
  createdAt: "createdAt"
};
var EmailVerificationTokenScalarFieldEnum = {
  id: "id",
  userId: "userId",
  tokenHash: "tokenHash",
  expiresAt: "expiresAt",
  createdAt: "createdAt"
};
var PasswordResetTokenScalarFieldEnum = {
  id: "id",
  userId: "userId",
  tokenHash: "tokenHash",
  expiresAt: "expiresAt",
  createdAt: "createdAt"
};
var OAuthAccountScalarFieldEnum = {
  id: "id",
  userId: "userId",
  provider: "provider",
  providerUserId: "providerUserId",
  createdAt: "createdAt"
};
var RoleScalarFieldEnum = {
  id: "id",
  code: "code",
  name: "name",
  createdAt: "createdAt"
};
var UserRoleScalarFieldEnum = {
  userId: "userId",
  roleId: "roleId"
};
var UserAddressScalarFieldEnum = {
  id: "id",
  userId: "userId",
  recipient: "recipient",
  phone: "phone",
  addressLine: "addressLine",
  ward: "ward",
  district: "district",
  city: "city",
  isDefault: "isDefault",
  ghnProvinceId: "ghnProvinceId",
  ghnDistrictId: "ghnDistrictId",
  ghnWardCode: "ghnWardCode",
  createdAt: "createdAt"
};
var ProductScalarFieldEnum = {
  id: "id",
  productTypeId: "productTypeId",
  name: "name",
  description: "description",
  basePrice: "basePrice",
  status: "status",
  isSale: "isSale",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProductVariantScalarFieldEnum = {
  id: "id",
  productId: "productId",
  sku: "sku",
  optionKey: "optionKey",
  status: "status",
  isDefault: "isDefault",
  attributes: "attributes",
  price: "price",
  stockAvailable: "stockAvailable",
  stockOnHand: "stockOnHand",
  stockReserved: "stockReserved",
  minStock: "minStock",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProductImageScalarFieldEnum = {
  id: "id",
  productId: "productId",
  variantId: "variantId",
  url: "url",
  altText: "altText",
  sortOrder: "sortOrder",
  isPrimary: "isPrimary",
  createdAt: "createdAt"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  description: "description",
  imageUrl: "imageUrl",
  sortOrder: "sortOrder",
  parentId: "parentId",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
};
var ProductCategoryScalarFieldEnum = {
  productId: "productId",
  categoryId: "categoryId",
  isPrimary: "isPrimary",
  sortOrder: "sortOrder"
};
var ProductTypeScalarFieldEnum = {
  id: "id",
  code: "code",
  name: "name",
  description: "description",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SizeChartRuleScalarFieldEnum = {
  id: "id",
  productId: "productId",
  productTypeId: "productTypeId",
  sizeLabel: "sizeLabel",
  minHeightCm: "minHeightCm",
  maxHeightCm: "maxHeightCm",
  minWeightKg: "minWeightKg",
  maxWeightKg: "maxWeightKg",
  fitPreference: "fitPreference",
  priority: "priority",
  isActive: "isActive",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var AttributeDefinitionScalarFieldEnum = {
  id: "id",
  code: "code",
  name: "name",
  scope: "scope",
  dataType: "dataType",
  unit: "unit",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var AttributeOptionScalarFieldEnum = {
  id: "id",
  attributeId: "attributeId",
  value: "value",
  label: "label",
  sortOrder: "sortOrder",
  swatchHex: "swatchHex",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProductTypeAttributeScalarFieldEnum = {
  productTypeId: "productTypeId",
  attributeId: "attributeId",
  isRequired: "isRequired",
  isFilterable: "isFilterable",
  isVariantAxis: "isVariantAxis",
  variantAxisOrder: "variantAxisOrder",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProductAttributeValueScalarFieldEnum = {
  id: "id",
  productId: "productId",
  attributeId: "attributeId",
  textValue: "textValue",
  numberValue: "numberValue",
  booleanValue: "booleanValue",
  dateValue: "dateValue",
  optionId: "optionId",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProductAttributeValueOptionScalarFieldEnum = {
  productAttributeValueId: "productAttributeValueId",
  optionId: "optionId"
};
var VariantAttributeValueScalarFieldEnum = {
  id: "id",
  variantId: "variantId",
  attributeId: "attributeId",
  textValue: "textValue",
  numberValue: "numberValue",
  booleanValue: "booleanValue",
  dateValue: "dateValue",
  optionId: "optionId",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TagScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug"
};
var ProductTagScalarFieldEnum = {
  productId: "productId",
  tagId: "tagId"
};
var CartScalarFieldEnum = {
  id: "id",
  userId: "userId",
  createdAt: "createdAt"
};
var CartItemScalarFieldEnum = {
  id: "id",
  cartId: "cartId",
  productId: "productId",
  variantId: "variantId",
  quantity: "quantity"
};
var OrderScalarFieldEnum = {
  id: "id",
  userId: "userId",
  subtotalPrice: "subtotalPrice",
  shippingFee: "shippingFee",
  totalPrice: "totalPrice",
  status: "status",
  returnStatus: "returnStatus",
  discountId: "discountId",
  discountAmount: "discountAmount",
  itemsSubtotal: "itemsSubtotal",
  productDiscount: "productDiscount",
  promotionDiscount: "promotionDiscount",
  voucherDiscount: "voucherDiscount",
  grandTotal: "grandTotal",
  carrierName: "carrierName",
  trackingCode: "trackingCode",
  deliveryNote: "deliveryNote",
  shippedAt: "shippedAt",
  deliveredAt: "deliveredAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var OrderShippingAddressScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  recipientName: "recipientName",
  phone: "phone",
  addressLine: "addressLine",
  ward: "ward",
  district: "district",
  city: "city",
  sourceAddressId: "sourceAddressId",
  snapshotSource: "snapshotSource",
  ghnProvinceId: "ghnProvinceId",
  ghnDistrictId: "ghnDistrictId",
  ghnWardCode: "ghnWardCode",
  createdAt: "createdAt"
};
var OrderShipmentScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  provider: "provider",
  providerOrderCode: "providerOrderCode",
  providerStatus: "providerStatus",
  serviceId: "serviceId",
  serviceTypeId: "serviceTypeId",
  codAmount: "codAmount",
  externalFee: "externalFee",
  rawCreatePayload: "rawCreatePayload",
  rawCreateResponse: "rawCreateResponse",
  rawLatestWebhook: "rawLatestWebhook",
  lastWebhookTime: "lastWebhookTime",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ReturnShipmentScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  provider: "provider",
  providerOrderCode: "providerOrderCode",
  providerStatus: "providerStatus",
  externalFee: "externalFee",
  rawCreatePayload: "rawCreatePayload",
  rawCreateResponse: "rawCreateResponse",
  rawLatestStatus: "rawLatestStatus",
  lastSyncedAt: "lastSyncedAt",
  deliveredAt: "deliveredAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var OrderItemScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  productId: "productId",
  variantId: "variantId",
  quantity: "quantity",
  price: "price",
  productName: "productName",
  productSlug: "productSlug",
  sku: "sku",
  variantName: "variantName",
  variantAttributes: "variantAttributes",
  imageUrl: "imageUrl",
  originalUnitPrice: "originalUnitPrice",
  sellingUnitPrice: "sellingUnitPrice",
  lineSubtotal: "lineSubtotal",
  lineDiscountAmount: "lineDiscountAmount",
  promotionDiscountAmount: "promotionDiscountAmount",
  voucherDiscountAmount: "voucherDiscountAmount",
  lineTotal: "lineTotal",
  voucherEligible: "voucherEligible",
  promotionId: "promotionId",
  promotionName: "promotionName",
  promotionSnapshot: "promotionSnapshot",
  snapshotSource: "snapshotSource"
};
var PaymentScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  amount: "amount",
  method: "method",
  transactionId: "transactionId",
  status: "status",
  createdAt: "createdAt",
  paidAt: "paidAt"
};
var PaymentTransactionScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  orderCode: "orderCode",
  amount: "amount",
  status: "status",
  bankCode: "bankCode",
  gatewayReference: "gatewayReference",
  gatewayCode: "gatewayCode",
  gatewayStatus: "gatewayStatus",
  paidAt: "paidAt",
  rawPayload: "rawPayload",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProductPriceHistoryScalarFieldEnum = {
  id: "id",
  productId: "productId",
  variantId: "variantId",
  oldPrice: "oldPrice",
  newPrice: "newPrice",
  changedBy: "changedBy",
  changedAt: "changedAt"
};
var DiscountScalarFieldEnum = {
  id: "id",
  code: "code",
  description: "description",
  type: "type",
  value: "value",
  maxDiscount: "maxDiscount",
  minOrderAmount: "minOrderAmount",
  maxUsage: "maxUsage",
  userUsageLimit: "userUsageLimit",
  usedCount: "usedCount",
  startAt: "startAt",
  endAt: "endAt",
  isActive: "isActive",
  isBirthdayVoucher: "isBirthdayVoucher",
  bannerImageUrl: "bannerImageUrl",
  scopeType: "scopeType",
  includeDescendants: "includeDescendants",
  minAmountBasis: "minAmountBasis",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BannerScalarFieldEnum = {
  id: "id",
  title: "title",
  subtitle: "subtitle",
  description: "description",
  imageUrl: "imageUrl",
  isActive: "isActive",
  sortOrder: "sortOrder",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var DiscountUsageScalarFieldEnum = {
  id: "id",
  discountId: "discountId",
  userId: "userId",
  orderId: "orderId",
  usageYear: "usageYear"
};
var BirthdayVoucherGrantScalarFieldEnum = {
  id: "id",
  userId: "userId",
  discountId: "discountId",
  year: "year",
  birthdayDate: "birthdayDate",
  email: "email",
  emailSentAt: "emailSentAt",
  idempotencyKey: "idempotencyKey",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var InventoryLogScalarFieldEnum = {
  id: "id",
  variantId: "variantId",
  action: "action",
  quantity: "quantity",
  referenceId: "referenceId",
  beforeQuantity: "beforeQuantity",
  afterQuantity: "afterQuantity",
  referenceType: "referenceType",
  actorId: "actorId",
  reason: "reason",
  salesChannel: "salesChannel",
  createdAt: "createdAt"
};
var ReturnScalarFieldEnum = {
  id: "id",
  orderItemId: "orderItemId",
  quantity: "quantity",
  requestType: "requestType",
  requestedVariantId: "requestedVariantId",
  reason: "reason",
  reasonCode: "reasonCode",
  evidenceImages: "evidenceImages",
  bankAccountName: "bankAccountName",
  bankAccountNumber: "bankAccountNumber",
  bankName: "bankName",
  status: "status",
  createdAt: "createdAt"
};
var OrderStatusHistoryScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  oldStatus: "oldStatus",
  newStatus: "newStatus",
  changedBy: "changedBy",
  reason: "reason",
  changedAt: "changedAt"
};
var NotificationScalarFieldEnum = {
  id: "id",
  userId: "userId",
  content: "content",
  isRead: "isRead",
  createdAt: "createdAt"
};
var UserActivityLogScalarFieldEnum = {
  id: "id",
  userId: "userId",
  action: "action",
  metadata: "metadata",
  createdAt: "createdAt"
};
var DiscountIncludedCategoryScalarFieldEnum = {
  discountId: "discountId",
  categoryId: "categoryId"
};
var DiscountExcludedCategoryScalarFieldEnum = {
  discountId: "discountId",
  categoryId: "categoryId"
};
var DiscountIncludedProductScalarFieldEnum = {
  discountId: "discountId",
  productId: "productId"
};
var DiscountExcludedProductScalarFieldEnum = {
  discountId: "discountId",
  productId: "productId"
};
var DiscountMemberTierScalarFieldEnum = {
  discountId: "discountId",
  tier: "tier"
};
var ChatSessionScalarFieldEnum = {
  id: "id",
  userId: "userId",
  status: "status",
  channel: "channel",
  guestToken: "guestToken",
  leadName: "leadName",
  leadPhone: "leadPhone",
  leadEmail: "leadEmail",
  budgetMin: "budgetMin",
  budgetMax: "budgetMax",
  shopperProfile: "shopperProfile",
  lastIntent: "lastIntent",
  lastSummary: "lastSummary",
  lastSuggestedProductIds: "lastSuggestedProductIds",
  lastMessageAt: "lastMessageAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ChatMessageScalarFieldEnum = {
  id: "id",
  sessionId: "sessionId",
  role: "role",
  content: "content",
  metadata: "metadata",
  createdAt: "createdAt"
};
var RecommendationEventScalarFieldEnum = {
  id: "id",
  eventType: "eventType",
  userId: "userId",
  sessionId: "sessionId",
  productId: "productId",
  orderId: "orderId",
  searchQuery: "searchQuery",
  dedupeKey: "dedupeKey",
  source: "source",
  placement: "placement",
  metadata: "metadata",
  occurredAt: "occurredAt",
  processedAt: "processedAt",
  createdAt: "createdAt"
};
var ProductSimilarityScalarFieldEnum = {
  productId: "productId",
  relatedProductId: "relatedProductId",
  algorithm: "algorithm",
  score: "score",
  rank: "rank",
  metadata: "metadata",
  updatedAt: "updatedAt",
  createdAt: "createdAt"
};
var RecommendationCacheScalarFieldEnum = {
  id: "id",
  cacheKey: "cacheKey",
  modelKind: "modelKind",
  userId: "userId",
  productId: "productId",
  sessionId: "sessionId",
  itemsJson: "itemsJson",
  metadata: "metadata",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ProductEmbeddingScalarFieldEnum = {
  productId: "productId",
  embedding: "embedding",
  embeddingText: "embeddingText",
  modelVersion: "modelVersion",
  dimensions: "dimensions",
  metadata: "metadata",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var UserEmbeddingScalarFieldEnum = {
  userId: "userId",
  embedding: "embedding",
  modelVersion: "modelVersion",
  dimensions: "dimensions",
  lastEventAt: "lastEventAt",
  metadata: "metadata",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var RecommendationExperimentScalarFieldEnum = {
  id: "id",
  key: "key",
  name: "name",
  description: "description",
  status: "status",
  traffic: "traffic",
  variants: "variants",
  metadata: "metadata",
  startAt: "startAt",
  endAt: "endAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var RecommendationMetricSnapshotScalarFieldEnum = {
  id: "id",
  metricDate: "metricDate",
  metricName: "metricName",
  metricValue: "metricValue",
  dimensions: "dimensions",
  metadata: "metadata",
  createdAt: "createdAt"
};
var VirtualTryOnRequestScalarFieldEnum = {
  id: "id",
  userId: "userId",
  productId: "productId",
  productImageUrl: "productImageUrl",
  humanImageUrl: "humanImageUrl",
  outputImageUrl: "outputImageUrl",
  outputPublicId: "outputPublicId",
  provider: "provider",
  modelName: "modelName",
  providerJobId: "providerJobId",
  status: "status",
  category: "category",
  garmentDes: "garmentDes",
  crop: "crop",
  forceDc: "forceDc",
  maskOnly: "maskOnly",
  steps: "steps",
  seed: "seed",
  latencyMs: "latencyMs",
  estimatedCostUsd: "estimatedCostUsd",
  errorCode: "errorCode",
  errorMessage: "errorMessage",
  startedAt: "startedAt",
  completedAt: "completedAt",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var WishlistScalarFieldEnum = {
  id: "id",
  userId: "userId",
  productId: "productId",
  createdAt: "createdAt"
};
var ReviewScalarFieldEnum = {
  id: "id",
  userId: "userId",
  productId: "productId",
  orderItemId: "orderItemId",
  rating: "rating",
  comment: "comment",
  createdAt: "createdAt"
};
var ReviewImageScalarFieldEnum = {
  id: "id",
  reviewId: "reviewId",
  url: "url",
  publicId: "publicId",
  sortOrder: "sortOrder",
  createdAt: "createdAt"
};
var AuditLogScalarFieldEnum = {
  id: "id",
  actorType: "actorType",
  actorId: "actorId",
  targetType: "targetType",
  targetId: "targetId",
  action: "action",
  oldData: "oldData",
  newData: "newData",
  createdAt: "createdAt"
};
var RefundTransactionScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  type: "type",
  amount: "amount",
  currency: "currency",
  status: "status",
  provider: "provider",
  providerRefundId: "providerRefundId",
  reason: "reason",
  initiatedBy: "initiatedBy",
  idempotencyKey: "idempotencyKey",
  failureReason: "failureReason",
  retryCount: "retryCount",
  requestedAt: "requestedAt",
  processedAt: "processedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var OrderCancelRequestScalarFieldEnum = {
  id: "id",
  orderId: "orderId",
  reasonCode: "reasonCode",
  reasonText: "reasonText",
  status: "status",
  requestedByUserId: "requestedByUserId",
  approvedByAdminId: "approvedByAdminId",
  rejectedByAdminId: "rejectedByAdminId",
  approvedAt: "approvedAt",
  rejectedAt: "rejectedAt",
  completedAt: "completedAt",
  rejectionReason: "rejectionReason",
  bankAccountName: "bankAccountName",
  bankAccountNumber: "bankAccountNumber",
  bankName: "bankName",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var LoyaltyAccountScalarFieldEnum = {
  id: "id",
  userId: "userId",
  balance: "balance",
  tier: "tier",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var LoyaltyTransactionScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  type: "type",
  points: "points",
  balanceAfter: "balanceAfter",
  referenceType: "referenceType",
  referenceId: "referenceId",
  idempotencyKey: "idempotencyKey",
  description: "description",
  expiresAt: "expiresAt",
  expiredAt: "expiredAt",
  sourcePoints: "sourcePoints",
  sourceTransactionId: "sourceTransactionId",
  createdAt: "createdAt"
};
var LoyaltyConfigScalarFieldEnum = {
  id: "id",
  spendPerPoint: "spendPerPoint",
  pointValidityDays: "pointValidityDays",
  silverMinPoints: "silverMinPoints",
  goldMinPoints: "goldMinPoints",
  isActive: "isActive",
  updatedAt: "updatedAt"
};
var PromotionScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  title: "title",
  subtitle: "subtitle",
  description: "description",
  bannerImageUrl: "bannerImageUrl",
  mobileBannerImageUrl: "mobileBannerImageUrl",
  campaignType: "campaignType",
  type: "type",
  status: "status",
  scopeType: "scopeType",
  includeDescendants: "includeDescendants",
  value: "value",
  maxDiscount: "maxDiscount",
  priority: "priority",
  displayPriority: "displayPriority",
  isFeatured: "isFeatured",
  ctaLabel: "ctaLabel",
  ctaUrl: "ctaUrl",
  memberTiers: "memberTiers",
  usageLimit: "usageLimit",
  usedCount: "usedCount",
  stackableWithVoucher: "stackableWithVoucher",
  startAt: "startAt",
  endAt: "endAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PromotionIncludedCategoryScalarFieldEnum = {
  promotionId: "promotionId",
  categoryId: "categoryId"
};
var PromotionIncludedProductScalarFieldEnum = {
  promotionId: "promotionId",
  productId: "productId"
};
var PromotionUsageScalarFieldEnum = {
  id: "id",
  promotionId: "promotionId",
  orderId: "orderId",
  discountAmount: "discountAmount",
  idempotencyKey: "idempotencyKey",
  createdAt: "createdAt"
};
var PhysicalSaleScalarFieldEnum = {
  id: "id",
  cashierId: "cashierId",
  paymentMethod: "paymentMethod",
  totalAmount: "totalAmount",
  code: "code",
  idempotencyKey: "idempotencyKey",
  status: "status",
  customerId: "customerId",
  customerName: "customerName",
  customerPhone: "customerPhone",
  paidAt: "paidAt",
  cancelledAt: "cancelledAt",
  cancelledBy: "cancelledBy",
  cancelReason: "cancelReason",
  note: "note",
  createdAt: "createdAt"
};
var PhysicalSaleItemScalarFieldEnum = {
  id: "id",
  saleId: "saleId",
  variantId: "variantId",
  quantity: "quantity",
  unitPrice: "unitPrice",
  productName: "productName",
  sku: "sku",
  variantAttributes: "variantAttributes",
  imageUrl: "imageUrl",
  lineTotal: "lineTotal"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var JsonNullValueInput = {
  JsonNull: JsonNull2
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var UserOrderByRelevanceFieldEnum = {
  id: "id",
  email: "email",
  phone: "phone",
  passwordHash: "passwordHash"
};
var RefreshTokenOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  token: "token",
  deviceInfo: "deviceInfo"
};
var EmailVerificationTokenOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  tokenHash: "tokenHash"
};
var PasswordResetTokenOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  tokenHash: "tokenHash"
};
var OAuthAccountOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  providerUserId: "providerUserId"
};
var RoleOrderByRelevanceFieldEnum = {
  code: "code",
  name: "name"
};
var UserRoleOrderByRelevanceFieldEnum = {
  userId: "userId"
};
var UserAddressOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  recipient: "recipient",
  phone: "phone",
  addressLine: "addressLine",
  ward: "ward",
  district: "district",
  city: "city",
  ghnWardCode: "ghnWardCode"
};
var ProductOrderByRelevanceFieldEnum = {
  id: "id",
  productTypeId: "productTypeId",
  name: "name",
  description: "description"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var ProductVariantOrderByRelevanceFieldEnum = {
  id: "id",
  productId: "productId",
  sku: "sku",
  optionKey: "optionKey"
};
var ProductImageOrderByRelevanceFieldEnum = {
  id: "id",
  productId: "productId",
  variantId: "variantId",
  url: "url",
  altText: "altText"
};
var CategoryOrderByRelevanceFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  description: "description",
  imageUrl: "imageUrl",
  parentId: "parentId"
};
var ProductCategoryOrderByRelevanceFieldEnum = {
  productId: "productId",
  categoryId: "categoryId"
};
var ProductTypeOrderByRelevanceFieldEnum = {
  id: "id",
  code: "code",
  name: "name",
  description: "description"
};
var SizeChartRuleOrderByRelevanceFieldEnum = {
  id: "id",
  productId: "productId",
  productTypeId: "productTypeId",
  sizeLabel: "sizeLabel",
  fitPreference: "fitPreference"
};
var AttributeDefinitionOrderByRelevanceFieldEnum = {
  id: "id",
  code: "code",
  name: "name",
  unit: "unit"
};
var AttributeOptionOrderByRelevanceFieldEnum = {
  id: "id",
  attributeId: "attributeId",
  value: "value",
  label: "label",
  swatchHex: "swatchHex"
};
var ProductTypeAttributeOrderByRelevanceFieldEnum = {
  productTypeId: "productTypeId",
  attributeId: "attributeId"
};
var ProductAttributeValueOrderByRelevanceFieldEnum = {
  id: "id",
  productId: "productId",
  attributeId: "attributeId",
  textValue: "textValue",
  optionId: "optionId"
};
var ProductAttributeValueOptionOrderByRelevanceFieldEnum = {
  productAttributeValueId: "productAttributeValueId",
  optionId: "optionId"
};
var VariantAttributeValueOrderByRelevanceFieldEnum = {
  id: "id",
  variantId: "variantId",
  attributeId: "attributeId",
  textValue: "textValue",
  optionId: "optionId"
};
var TagOrderByRelevanceFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug"
};
var ProductTagOrderByRelevanceFieldEnum = {
  productId: "productId",
  tagId: "tagId"
};
var CartOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId"
};
var CartItemOrderByRelevanceFieldEnum = {
  id: "id",
  cartId: "cartId",
  productId: "productId",
  variantId: "variantId"
};
var OrderOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  discountId: "discountId",
  carrierName: "carrierName",
  trackingCode: "trackingCode",
  deliveryNote: "deliveryNote"
};
var OrderShippingAddressOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  recipientName: "recipientName",
  phone: "phone",
  addressLine: "addressLine",
  ward: "ward",
  district: "district",
  city: "city",
  sourceAddressId: "sourceAddressId",
  snapshotSource: "snapshotSource",
  ghnWardCode: "ghnWardCode"
};
var OrderShipmentOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  provider: "provider",
  providerOrderCode: "providerOrderCode",
  providerStatus: "providerStatus"
};
var ReturnShipmentOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  provider: "provider",
  providerOrderCode: "providerOrderCode",
  providerStatus: "providerStatus"
};
var OrderItemOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  productId: "productId",
  variantId: "variantId",
  productName: "productName",
  productSlug: "productSlug",
  sku: "sku",
  variantName: "variantName",
  imageUrl: "imageUrl",
  promotionId: "promotionId",
  promotionName: "promotionName",
  snapshotSource: "snapshotSource"
};
var PaymentOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  method: "method",
  transactionId: "transactionId"
};
var PaymentTransactionOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  orderCode: "orderCode",
  bankCode: "bankCode",
  gatewayReference: "gatewayReference",
  gatewayCode: "gatewayCode",
  gatewayStatus: "gatewayStatus"
};
var ProductPriceHistoryOrderByRelevanceFieldEnum = {
  id: "id",
  productId: "productId",
  variantId: "variantId",
  changedBy: "changedBy"
};
var DiscountOrderByRelevanceFieldEnum = {
  id: "id",
  code: "code",
  description: "description",
  bannerImageUrl: "bannerImageUrl"
};
var BannerOrderByRelevanceFieldEnum = {
  id: "id",
  title: "title",
  subtitle: "subtitle",
  description: "description",
  imageUrl: "imageUrl"
};
var DiscountUsageOrderByRelevanceFieldEnum = {
  id: "id",
  discountId: "discountId",
  userId: "userId",
  orderId: "orderId"
};
var BirthdayVoucherGrantOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  discountId: "discountId",
  email: "email",
  idempotencyKey: "idempotencyKey"
};
var InventoryLogOrderByRelevanceFieldEnum = {
  id: "id",
  variantId: "variantId",
  referenceId: "referenceId",
  referenceType: "referenceType",
  actorId: "actorId",
  reason: "reason"
};
var ReturnOrderByRelevanceFieldEnum = {
  id: "id",
  orderItemId: "orderItemId",
  requestedVariantId: "requestedVariantId",
  reason: "reason",
  reasonCode: "reasonCode",
  bankAccountName: "bankAccountName",
  bankAccountNumber: "bankAccountNumber",
  bankName: "bankName"
};
var OrderStatusHistoryOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  changedBy: "changedBy",
  reason: "reason"
};
var NotificationOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  content: "content"
};
var UserActivityLogOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  action: "action"
};
var DiscountIncludedCategoryOrderByRelevanceFieldEnum = {
  discountId: "discountId",
  categoryId: "categoryId"
};
var DiscountExcludedCategoryOrderByRelevanceFieldEnum = {
  discountId: "discountId",
  categoryId: "categoryId"
};
var DiscountIncludedProductOrderByRelevanceFieldEnum = {
  discountId: "discountId",
  productId: "productId"
};
var DiscountExcludedProductOrderByRelevanceFieldEnum = {
  discountId: "discountId",
  productId: "productId"
};
var DiscountMemberTierOrderByRelevanceFieldEnum = {
  discountId: "discountId",
  tier: "tier"
};
var ChatSessionOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  channel: "channel",
  guestToken: "guestToken",
  leadName: "leadName",
  leadPhone: "leadPhone",
  leadEmail: "leadEmail",
  lastIntent: "lastIntent",
  lastSummary: "lastSummary"
};
var ChatMessageOrderByRelevanceFieldEnum = {
  id: "id",
  sessionId: "sessionId",
  content: "content"
};
var RecommendationEventOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  sessionId: "sessionId",
  productId: "productId",
  orderId: "orderId",
  searchQuery: "searchQuery",
  dedupeKey: "dedupeKey",
  source: "source",
  placement: "placement"
};
var ProductSimilarityOrderByRelevanceFieldEnum = {
  productId: "productId",
  relatedProductId: "relatedProductId",
  algorithm: "algorithm"
};
var RecommendationCacheOrderByRelevanceFieldEnum = {
  id: "id",
  cacheKey: "cacheKey",
  userId: "userId",
  productId: "productId",
  sessionId: "sessionId"
};
var ProductEmbeddingOrderByRelevanceFieldEnum = {
  productId: "productId",
  embeddingText: "embeddingText",
  modelVersion: "modelVersion"
};
var UserEmbeddingOrderByRelevanceFieldEnum = {
  userId: "userId",
  modelVersion: "modelVersion"
};
var RecommendationExperimentOrderByRelevanceFieldEnum = {
  id: "id",
  key: "key",
  name: "name",
  description: "description",
  status: "status"
};
var RecommendationMetricSnapshotOrderByRelevanceFieldEnum = {
  id: "id",
  metricName: "metricName"
};
var VirtualTryOnRequestOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  productId: "productId",
  productImageUrl: "productImageUrl",
  humanImageUrl: "humanImageUrl",
  outputImageUrl: "outputImageUrl",
  outputPublicId: "outputPublicId",
  provider: "provider",
  modelName: "modelName",
  providerJobId: "providerJobId",
  category: "category",
  garmentDes: "garmentDes",
  errorCode: "errorCode",
  errorMessage: "errorMessage"
};
var WishlistOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  productId: "productId"
};
var ReviewOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  productId: "productId",
  orderItemId: "orderItemId",
  comment: "comment"
};
var ReviewImageOrderByRelevanceFieldEnum = {
  id: "id",
  reviewId: "reviewId",
  url: "url",
  publicId: "publicId"
};
var AuditLogOrderByRelevanceFieldEnum = {
  id: "id",
  actorId: "actorId",
  targetType: "targetType",
  targetId: "targetId",
  action: "action"
};
var RefundTransactionOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  currency: "currency",
  provider: "provider",
  providerRefundId: "providerRefundId",
  reason: "reason",
  idempotencyKey: "idempotencyKey",
  failureReason: "failureReason"
};
var OrderCancelRequestOrderByRelevanceFieldEnum = {
  id: "id",
  orderId: "orderId",
  reasonText: "reasonText",
  requestedByUserId: "requestedByUserId",
  approvedByAdminId: "approvedByAdminId",
  rejectedByAdminId: "rejectedByAdminId",
  rejectionReason: "rejectionReason",
  bankAccountName: "bankAccountName",
  bankAccountNumber: "bankAccountNumber",
  bankName: "bankName"
};
var LoyaltyAccountOrderByRelevanceFieldEnum = {
  id: "id",
  userId: "userId",
  tier: "tier"
};
var LoyaltyTransactionOrderByRelevanceFieldEnum = {
  id: "id",
  accountId: "accountId",
  referenceType: "referenceType",
  referenceId: "referenceId",
  idempotencyKey: "idempotencyKey",
  description: "description",
  sourceTransactionId: "sourceTransactionId"
};
var PromotionOrderByRelevanceFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  title: "title",
  subtitle: "subtitle",
  description: "description",
  bannerImageUrl: "bannerImageUrl",
  mobileBannerImageUrl: "mobileBannerImageUrl",
  ctaLabel: "ctaLabel",
  ctaUrl: "ctaUrl"
};
var PromotionIncludedCategoryOrderByRelevanceFieldEnum = {
  promotionId: "promotionId",
  categoryId: "categoryId"
};
var PromotionIncludedProductOrderByRelevanceFieldEnum = {
  promotionId: "promotionId",
  productId: "productId"
};
var PromotionUsageOrderByRelevanceFieldEnum = {
  id: "id",
  promotionId: "promotionId",
  orderId: "orderId",
  idempotencyKey: "idempotencyKey"
};
var PhysicalSaleOrderByRelevanceFieldEnum = {
  id: "id",
  cashierId: "cashierId",
  paymentMethod: "paymentMethod",
  code: "code",
  idempotencyKey: "idempotencyKey",
  customerId: "customerId",
  customerName: "customerName",
  customerPhone: "customerPhone",
  cancelledBy: "cancelledBy",
  cancelReason: "cancelReason",
  note: "note"
};
var PhysicalSaleItemOrderByRelevanceFieldEnum = {
  id: "id",
  saleId: "saleId",
  variantId: "variantId",
  productName: "productName",
  sku: "sku",
  imageUrl: "imageUrl"
};
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/infrastructure/database/prisma.service.ts
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";
var PrismaService = class _PrismaService {
  static instance = null;
  static getInstance() {
    const env = process.env.NODE_ENV || "development";
    dotenv.config({
      path: `.env.${env}`
    });
    if (!_PrismaService.instance) {
      const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
      _PrismaService.instance = new PrismaClient({ adapter });
    }
    return _PrismaService.instance;
  }
  static async disconnect() {
    if (_PrismaService.instance) {
      await _PrismaService.instance.$disconnect();
      _PrismaService.instance = null;
    }
  }
};
var prisma = PrismaService.getInstance();

// src/infrastructure/database/redis.service.ts
import Redis from "ioredis";
var RedisService = class _RedisService {
  static instance;
  redis;
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 1e4,
      lazyConnect: true
    });
    this.redis.on("connect", () => {
      console.log("\u2705 Redis connected successfully");
    });
    this.redis.on("error", (error) => {
      console.error("\u274C Redis connection error:", error);
    });
    this.redis.on("close", () => {
      console.log("\u{1F50C} Redis connection closed");
    });
  }
  static getInstance() {
    if (!_RedisService.instance) {
      _RedisService.instance = new _RedisService();
    }
    return _RedisService.instance;
  }
  getClient() {
    return this.redis;
  }
  async disconnect() {
    await this.redis.disconnect();
  }
  async ping() {
    return await this.redis.ping();
  }
  async isConnected() {
    try {
      await this.ping();
      return true;
    } catch {
      return false;
    }
  }
};
var redisService = RedisService.getInstance();
var redis = redisService.getClient();

// src/shared/util/logger.ts
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path2 from "path";
import { inspect } from "util";
var levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};
var colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white"
};
winston.addColors(colors);
var level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "http";
};
var format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);
var consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf((info) => {
    const { timestamp, level: level2, message } = info;
    const meta = Object.fromEntries(
      Object.entries(info).filter(
        ([key, value]) => key !== "timestamp" && key !== "level" && key !== "message" && value !== void 0
      )
    );
    const metaKeys = Object.keys(meta);
    if (metaKeys.length === 0) {
      return `${timestamp} ${level2}: ${message}`;
    }
    const serializedMeta = inspect(meta, {
      depth: 5,
      colors: true,
      compact: true,
      breakLength: 140
    });
    return `${timestamp} ${level2}: ${message} ${serializedMeta}`;
  })
);
var transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat
  })
];
if (process.env.NODE_ENV === "production" || process.env.ENABLE_FILE_LOGGING === "true") {
  const logsDir = path2.join(process.cwd(), "logs");
  transports.push(
    new DailyRotateFile({
      filename: path2.join(logsDir, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format
    })
  );
  transports.push(
    new DailyRotateFile({
      level: "error",
      filename: path2.join(logsDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      format
    })
  );
  transports.push(
    new DailyRotateFile({
      level: "http",
      filename: path2.join(logsDir, "http-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "7d",
      format
    })
  );
}
var logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});
var Logger = class {
  context;
  constructor(context) {
    this.context = context;
  }
  formatMessage(message, meta) {
    const formattedMessage = `[${this.context}] ${message}`;
    if (meta) {
      return { message: formattedMessage, ...meta };
    }
    return formattedMessage;
  }
  error(message, error, meta) {
    if (error instanceof Error) {
      logger.error(
        this.formatMessage(message, {
          ...meta,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        })
      );
    } else if (error) {
      logger.error(this.formatMessage(message, { ...meta, error }));
    } else {
      logger.error(this.formatMessage(message, meta));
    }
  }
  warn(message, meta) {
    logger.warn(this.formatMessage(message, meta));
  }
  info(message, meta) {
    logger.info(this.formatMessage(message, meta));
  }
  http(message, meta) {
    logger.http(this.formatMessage(message, meta));
  }
  debug(message, meta) {
    logger.debug(this.formatMessage(message, meta));
  }
};
var createLogger = (context) => new Logger(context);

// src/module/payment/infrastructure/payos/payos.client.ts
import { PayOS } from "@payos/node";

// src/error-handlling/customError.ts
var CustomError = class _CustomError extends Error {
  statusCode;
  code;
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, _CustomError.prototype);
  }
};

// src/shared/server/error-codes.ts
var ErrorCode = {
  // Validation Errors (4001-4099)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PHONE: "INVALID_PHONE",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  INVALID_OTP: "INVALID_OTP",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  // Authentication Errors (4010-4099)
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  INVALID_REFRESH_TOKEN: "INVALID_REFRESH_TOKEN",
  // Resource Errors (4040-4099)
  NOT_FOUND: "NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  OTP_NOT_FOUND: "OTP_NOT_FOUND",
  // Conflict Errors (4090-4099)
  CONFLICT: "CONFLICT",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  PHONE_ALREADY_EXISTS: "PHONE_ALREADY_EXISTS",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  // Business Logic Errors (4200-4299)
  TOO_MANY_OTP_ATTEMPTS: "TOO_MANY_OTP_ATTEMPTS",
  OTP_EXPIRED: "OTP_EXPIRED",
  USER_NOT_ACTIVE: "USER_NOT_ACTIVE",
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  // Server Errors (5000-5099)
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE"
};
var ErrorCodeToStatusCode = {
  // Validation Errors - 400
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_PHONE]: 400,
  [ErrorCode.INVALID_PASSWORD]: 400,
  [ErrorCode.INVALID_OTP]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  // Authentication Errors - 401
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_REFRESH_TOKEN]: 401,
  // Not Found - 404
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.OTP_NOT_FOUND]: 404,
  // Conflict - 409
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.PHONE_ALREADY_EXISTS]: 409,
  [ErrorCode.DUPLICATE_RESOURCE]: 409,
  // Business Logic - 422
  [ErrorCode.TOO_MANY_OTP_ATTEMPTS]: 422,
  [ErrorCode.OTP_EXPIRED]: 422,
  [ErrorCode.USER_NOT_ACTIVE]: 422,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  // Server Errors - 500
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EMAIL_SEND_FAILED]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503
};

// src/error-handlling/badRequestError.ts
var BadRequestError = class _BadRequestError extends CustomError {
  constructor(message, code = ErrorCode.VALIDATION_ERROR) {
    super(message, 400, code);
    Object.setPrototypeOf(this, _BadRequestError.prototype);
  }
};

// src/module/payment/infrastructure/payos/payos.config.ts
function readEnv(primary, fallback) {
  const primaryValue = process.env[primary]?.trim();
  if (primaryValue) return primaryValue;
  if (!fallback) return void 0;
  const fallbackValue = process.env[fallback]?.trim();
  return fallbackValue || void 0;
}
function getRequiredEnv(primary, fallback) {
  const value = readEnv(primary, fallback);
  if (!value) {
    const keyMessage = fallback ? `${primary} or ${fallback}` : primary;
    throw new BadRequestError(`Missing environment variable: ${keyMessage}`);
  }
  return value;
}
function getPayosConfig() {
  return {
    clientId: getRequiredEnv("CLIENT_ID", "PAYOS_CLIENT_ID"),
    apiKey: getRequiredEnv("API_KEY", "PAYOS_API_KEY"),
    checksumKey: getRequiredEnv("CHECKSUM_KEY", "PAYOS_CHECKSUM_KEY"),
    returnUrl: getRequiredEnv("PAYOS_RETURN_URL"),
    cancelUrl: getRequiredEnv("PAYOS_CANCEL_URL")
  };
}

// src/module/payment/infrastructure/payos/payos.client.ts
var payosClient = null;
function getPayosClient() {
  if (payosClient) {
    return payosClient;
  }
  const config2 = getPayosConfig();
  payosClient = new PayOS({
    clientId: config2.clientId,
    apiKey: config2.apiKey,
    checksumKey: config2.checksumKey,
    logLevel: "warn"
  });
  return payosClient;
}

// src/module/admin/notifications/infrastructure/realtime/admin-notification-hub.ts
var AdminNotificationHub = class {
  clients = /* @__PURE__ */ new Map();
  addClient(userId, res) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.clients.set(id, { id, userId, res });
    return id;
  }
  removeClient(clientId) {
    this.clients.delete(clientId);
  }
  sendKeepAlive(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;
    client.res.write(": keepalive\n\n");
  }
  sendPaymentSuccess(userId, payload) {
    for (const client of this.clients.values()) {
      if (client.userId !== userId) continue;
      client.res.write("event: payment_success\n");
      client.res.write(`data: ${JSON.stringify(payload)}

`);
    }
  }
  sendLowStock(userId, payload) {
    for (const client of this.clients.values()) {
      if (client.userId !== userId) continue;
      client.res.write("event: low_stock\n");
      client.res.write(`data: ${JSON.stringify(payload)}

`);
    }
  }
  sendCancelRequest(userId, payload) {
    for (const client of this.clients.values()) {
      if (client.userId !== userId) continue;
      client.res.write("event: cancel_request\n");
      client.res.write(`data: ${JSON.stringify(payload)}

`);
    }
  }
  sendNewOrder(userId, payload) {
    for (const client of this.clients.values()) {
      if (client.userId !== userId) continue;
      client.res.write("event: new_order\n");
      client.res.write(`data: ${JSON.stringify(payload)}

`);
    }
  }
};
var adminNotificationHub = new AdminNotificationHub();

// src/module/admin/notifications/infrastructure/services/admin-low-stock-notification.processor.ts
var logger2 = createLogger("AdminLowStockNotificationProcessor");
var LOW_STOCK_DEDUPE_TTL_SECONDS = Number(process.env.ADMIN_LOW_STOCK_DEDUPE_TTL_SEC || 86400);
var AdminLowStockNotificationProcessor = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  async process(input) {
    const dedupeKey = `notify:admin:low-stock:${input.variantId}:${input.stockOnHand}`;
    const lockResult = await redis.set(
      dedupeKey,
      JSON.stringify({ stockOnHand: input.stockOnHand, minStock: input.minStock }),
      "EX",
      Number.isFinite(LOW_STOCK_DEDUPE_TTL_SECONDS) && LOW_STOCK_DEDUPE_TTL_SECONDS > 0 ? LOW_STOCK_DEDUPE_TTL_SECONDS : 86400,
      "NX"
    );
    if (lockResult !== "OK") {
      return false;
    }
    try {
      const admins = await this.prisma.userRole.findMany({
        where: {
          role: {
            code: "ADMIN"
          }
        },
        select: {
          userId: true
        },
        distinct: ["userId"]
      });
      if (admins.length === 0) {
        return false;
      }
      const stockLabel = input.stockOnHand === 0 ? "\u0111\xE3 h\u1EBFt h\xE0ng" : `c\xF2n ${input.stockOnHand}, ng\u01B0\u1EE1ng c\u1EA3nh b\xE1o ${input.minStock}`;
      const content = `C\u1EA3nh b\xE1o t\u1ED3n kho: ${input.productName} (SKU: ${input.sku}) ${stockLabel}`;
      const createdRows = await this.prisma.$transaction(
        admins.map(
          (admin) => this.prisma.notification.create({
            data: {
              userId: admin.userId,
              content,
              isRead: false
            },
            select: {
              id: true,
              content: true,
              isRead: true,
              createdAt: true,
              userId: true
            }
          })
        )
      );
      for (const row of createdRows) {
        adminNotificationHub.sendLowStock(row.userId, {
          id: row.id,
          content: row.content,
          isRead: row.isRead,
          createdAt: row.createdAt.toISOString()
        });
      }
      await this.prisma.auditLog.create({
        data: {
          actorType: "SYSTEM",
          targetType: "ProductVariant",
          targetId: input.variantId,
          action: "ADMIN_LOW_STOCK_NOTIFICATION_SENT",
          newData: {
            orderId: input.orderId,
            orderCode: input.orderCode,
            productId: input.productId,
            productName: input.productName,
            variantId: input.variantId,
            sku: input.sku,
            stockOnHand: input.stockOnHand,
            minStock: input.minStock,
            receivers: createdRows.length
          }
        }
      });
      logger2.info("Admin notifications sent for low-stock variant", {
        variantId: input.variantId,
        sku: input.sku,
        stockOnHand: input.stockOnHand,
        minStock: input.minStock,
        receivers: createdRows.length
      });
      return true;
    } catch (error) {
      await redis.del(dedupeKey);
      throw error;
    }
  }
};

// src/module/payment/infrastructure/repositories/prisma-payment.repository.ts
var logger3 = createLogger("PrismaPaymentRepository");
function shouldNotifyLowStock(previousStockOnHand, currentStockOnHand, minStock) {
  return previousStockOnHand > minStock && currentStockOnHand <= minStock;
}
var PrismaPaymentRepository = class {
  constructor(prisma2, voucherCheckoutService, lowStockNotificationProcessor) {
    this.prisma = prisma2;
    this.voucherCheckoutService = voucherCheckoutService;
    this.lowStockNotificationProcessor = lowStockNotificationProcessor ?? new AdminLowStockNotificationProcessor(prisma2);
  }
  lowStockNotificationProcessor;
  async createPendingTransaction(input) {
    const paymentMethod = input.paymentMethod ?? "PAYOS";
    if (paymentMethod === "PAYOS" && !input.orderCode) {
      throw new BadRequestError("orderCode is required for PayOS checkout");
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const checkoutPricing = await this.voucherCheckoutService.calculateForCheckout({
        userId: input.userId,
        amount: input.amount,
        voucherCode: input.voucherCode,
        cartItemIds: input.cartItemIds,
        tx
      });
      const cartItems = await tx.cartItem.findMany({
        where: { cartId: checkoutPricing.cartId, id: { in: checkoutPricing.itemIds } },
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
          variant: {
            select: {
              price: true,
              sku: true,
              attributes: true,
              images: { select: { url: true, isPrimary: true, sortOrder: true } },
              product: {
                select: {
                  name: true,
                  basePrice: true,
                  images: { select: { url: true, isPrimary: true, sortOrder: true } }
                }
              }
            }
          }
        }
      });
      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }
      const order = await tx.order.create({
        data: {
          userId: input.userId,
          subtotalPrice: checkoutPricing.subtotalAmount,
          shippingFee: 0,
          totalPrice: checkoutPricing.payableAmount,
          status: "PENDING",
          discountId: checkoutPricing.appliedVoucherId,
          discountAmount: checkoutPricing.discountAmount > 0 ? checkoutPricing.discountAmount : null,
          itemsSubtotal: checkoutPricing.subtotalAmount,
          productDiscount: checkoutPricing.promotionDiscountAmount,
          promotionDiscount: checkoutPricing.promotionDiscountAmount,
          voucherDiscount: checkoutPricing.voucherDiscountAmount,
          grandTotal: checkoutPricing.payableAmount,
          shippingAddress: {
            create: {
              recipientName: input.shipping.recipientName,
              phone: input.shipping.phone,
              addressLine: input.shipping.addressLine,
              ward: input.shipping.ward,
              district: input.shipping.district,
              city: input.shipping.city,
              sourceAddressId: input.shipping.sourceAddressId,
              ghnProvinceId: input.shipping.ghnProvinceId ?? null,
              ghnDistrictId: input.shipping.ghnDistrictId ?? null,
              ghnWardCode: input.shipping.ghnWardCode ?? null,
              snapshotSource: "CHECKOUT"
            }
          }
        },
        select: {
          id: true
        }
      });
      await this.reserveStockForCheckout(tx, cartItems, order.id);
      await tx.orderItem.createMany({
        data: cartItems.map((item) => {
          if (!item.variantId || !item.variant) {
            throw new Error(`Cart item ${item.id} missing required variant`);
          }
          const unitPrice = Math.round(Number(item.variant.price));
          const lineSubtotal = unitPrice * item.quantity;
          const allocation = checkoutPricing.itemDiscounts?.find(
            (row) => row.cartItemId === item.id
          );
          const lineDiscountAmount = allocation?.discountAmount ?? 0;
          const promotionDiscountAmount = allocation?.promotionDiscountAmount ?? 0;
          const voucherDiscountAmount = allocation?.voucherDiscountAmount ?? 0;
          const product = item.variant.product ?? {
            name: "",
            basePrice: item.variant.price,
            images: []
          };
          const images = [...item.variant.images ?? [], ...product.images ?? []].sort(
            (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder
          );
          const attributes = item.variant.attributes;
          return {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.variant.price,
            productName: product.name,
            productSlug: null,
            sku: item.variant.sku ?? "",
            variantName: Object.values(item.variant.attributes ?? {}).filter(Boolean).join(" / ").slice(0, 255) || null,
            variantAttributes: attributes ?? {},
            imageUrl: images[0]?.url ?? null,
            originalUnitPrice: product.basePrice,
            sellingUnitPrice: Math.max(
              0,
              unitPrice - Math.floor(promotionDiscountAmount / item.quantity)
            ),
            lineSubtotal,
            lineDiscountAmount,
            promotionDiscountAmount,
            voucherDiscountAmount,
            lineTotal: lineSubtotal - lineDiscountAmount,
            voucherEligible: allocation?.eligible ?? false,
            promotionId: allocation?.promotion?.promotionId ?? null,
            promotionName: allocation?.promotion?.promotionName ?? null,
            promotionSnapshot: allocation?.promotion?.snapshot ?? prismaNamespace_exports.JsonNull,
            snapshotSource: "CHECKOUT"
          };
        })
      });
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: checkoutPricing.payableAmount,
          method: paymentMethod,
          status: "PENDING"
        }
      });
      if (paymentMethod === "PAYOS") {
        await tx.paymentTransaction.create({
          data: {
            orderId: order.id,
            orderCode: input.orderCode,
            amount: checkoutPricing.payableAmount,
            status: "PENDING",
            rawPayload: {
              checkout: {
                source: "cart",
                cartId: checkoutPricing.cartId,
                cartItemIds: cartItems.map((i) => i.id),
                subtotalAmount: checkoutPricing.subtotalAmount,
                promotionDiscountAmount: checkoutPricing.promotionDiscountAmount,
                voucherDiscountAmount: checkoutPricing.voucherDiscountAmount,
                loyaltyDiscountAmount: checkoutPricing.loyaltyDiscountAmount,
                loyaltyDiscountPercent: checkoutPricing.loyaltyDiscountPercent,
                loyaltyTier: checkoutPricing.loyaltyTier,
                loyaltyTierLabel: checkoutPricing.loyaltyTierLabel,
                discountAmount: checkoutPricing.discountAmount,
                payableAmount: checkoutPricing.payableAmount,
                voucherCode: checkoutPricing.appliedVoucherCode ?? null,
                items: cartItems.map((i) => ({
                  productId: i.productId,
                  variantId: i.variantId,
                  quantity: i.quantity
                }))
              }
            }
          }
        });
      }
      await tx.auditLog.create({
        data: {
          actorType: "USER",
          actorId: input.userId,
          targetType: "Order",
          targetId: order.id,
          action: "USER_CHECKOUT_CREATED",
          newData: {
            orderCode: input.orderCode ?? null,
            paymentMethod,
            subtotalAmount: checkoutPricing.subtotalAmount,
            discountAmount: checkoutPricing.discountAmount,
            promotionDiscountAmount: checkoutPricing.promotionDiscountAmount,
            voucherDiscountAmount: checkoutPricing.voucherDiscountAmount,
            loyaltyDiscountAmount: checkoutPricing.loyaltyDiscountAmount,
            loyaltyDiscountPercent: checkoutPricing.loyaltyDiscountPercent,
            loyaltyTier: checkoutPricing.loyaltyTier,
            loyaltyTierLabel: checkoutPricing.loyaltyTierLabel,
            payableAmount: checkoutPricing.payableAmount,
            voucherCode: checkoutPricing.appliedVoucherCode ?? null,
            cartItemIds: cartItems.map((i) => i.id)
          }
        }
      });
      if (paymentMethod === "COD") {
        await tx.cartItem.deleteMany({
          where: {
            cartId: checkoutPricing.cartId,
            id: { in: cartItems.map((item) => item.id) }
          }
        });
      }
      return {
        orderId: order.id,
        payableAmount: checkoutPricing.payableAmount,
        discountAmount: checkoutPricing.discountAmount,
        subtotalAmount: checkoutPricing.subtotalAmount,
        appliedVoucherCode: checkoutPricing.appliedVoucherCode
      };
    });
    return result;
  }
  async existsByOrderCode(orderCode) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { orderCode },
      select: { id: true }
    });
    return Boolean(payment);
  }
  async findByOrderCode(orderCode) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { orderCode },
      select: {
        orderId: true,
        orderCode: true,
        amount: true,
        status: true,
        bankCode: true,
        gatewayReference: true,
        gatewayCode: true,
        paidAt: true
      }
    });
    if (!payment) {
      return null;
    }
    return {
      orderId: payment.orderId,
      orderCode: payment.orderCode,
      amount: Number(payment.amount),
      status: payment.status,
      bankCode: payment.bankCode,
      gatewayReference: payment.gatewayReference,
      gatewayCode: payment.gatewayCode,
      paidAt: payment.paidAt
    };
  }
  async findByOrderCodeForUser(orderCode, userId) {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: {
        orderCode,
        order: {
          userId
        }
      },
      select: {
        orderId: true,
        orderCode: true,
        amount: true,
        status: true,
        bankCode: true,
        gatewayReference: true,
        gatewayCode: true,
        paidAt: true
      }
    });
    if (!payment) {
      return null;
    }
    return {
      orderId: payment.orderId,
      orderCode: payment.orderCode,
      amount: Number(payment.amount),
      status: payment.status,
      bankCode: payment.bankCode,
      gatewayReference: payment.gatewayReference,
      gatewayCode: payment.gatewayCode,
      paidAt: payment.paidAt
    };
  }
  async setCheckoutReference(orderCode, paymentLinkId) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentTransaction.findUnique({
        where: { orderCode },
        select: { orderId: true }
      });
      if (!existing) {
        return;
      }
      await tx.paymentTransaction.update({
        where: { orderCode },
        data: {
          gatewayReference: paymentLinkId
        }
      });
      await tx.payment.update({
        where: { orderId: existing.orderId },
        data: {
          transactionId: paymentLinkId
        }
      });
    });
  }
  async markCreateLinkFailed(orderCode, reason) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentTransaction.findUnique({
        where: { orderCode },
        select: {
          orderId: true,
          status: true,
          order: { select: { userId: true } }
        }
      });
      if (!existing || existing.status !== "PENDING") {
        return;
      }
      await tx.paymentTransaction.update({
        where: { orderCode },
        data: {
          status: "FAILED",
          gatewayCode: "LINK_FAIL",
          rawPayload: { reason }
        }
      });
      await tx.payment.update({
        where: { orderId: existing.orderId },
        data: {
          status: "FAILED"
        }
      });
      await tx.order.updateMany({
        where: { id: existing.orderId, status: "PENDING" },
        data: { status: "CANCELLED" }
      });
      await this.releaseReservedStockForOrder(tx, existing.orderId);
      await tx.auditLog.create({
        data: {
          actorType: "USER",
          actorId: existing.order.userId,
          targetType: "Order",
          targetId: existing.orderId,
          action: "USER_PAYMENT_LINK_FAILED",
          newData: {
            orderCode,
            reason
          }
        }
      });
    });
  }
  async updateFromWebhookIfPending(input) {
    let lowStockNotifications = [];
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.paymentTransaction.findUnique({
        where: { orderCode: input.orderCode },
        select: {
          orderId: true,
          status: true,
          rawPayload: true,
          order: { select: { userId: true } }
        }
      });
      if (!current || current.status !== "PENDING") {
        return false;
      }
      const updateResult = await tx.paymentTransaction.updateMany({
        where: {
          orderCode: input.orderCode,
          status: "PENDING"
        },
        data: {
          status: input.status,
          bankCode: input.bankCode,
          gatewayReference: input.gatewayReference ?? input.paymentLinkId,
          gatewayCode: input.gatewayCode,
          gatewayStatus: input.gatewayCode,
          paidAt: input.paidAt,
          rawPayload: this.mergeRawPayload(current.rawPayload, {
            webhook: input.rawPayload
          })
        }
      });
      if (updateResult.count === 0) {
        return false;
      }
      await tx.payment.update({
        where: { orderId: current.orderId },
        data: {
          status: input.status === "PAID" ? "PAID" : input.status === "EXPIRED" ? "EXPIRED" : "FAILED",
          transactionId: input.paymentLinkId ?? input.gatewayReference,
          paidAt: input.paidAt
        }
      });
      if (input.status === "PAID") {
        await tx.order.updateMany({
          where: { id: current.orderId, status: "PENDING" },
          data: { status: "PAID" }
        });
      } else {
        await tx.order.updateMany({
          where: { id: current.orderId, status: "PENDING" },
          data: { status: "CANCELLED" }
        });
      }
      if (input.status === "PAID") {
        await this.voucherCheckoutService.recordPromotionUsageForPaidOrder?.(tx, current.orderId);
        await this.voucherCheckoutService.recordUsageForPaidOrder(tx, current.orderId);
        lowStockNotifications = await this.consumeStockForPaidOrder(
          tx,
          current.orderId,
          input.orderCode
        );
        await this.removePurchasedCartItems(tx, current.orderId, current.rawPayload);
      } else {
        await this.releaseReservedStockForOrder(tx, current.orderId);
      }
      await tx.auditLog.create({
        data: {
          actorType: "USER",
          actorId: current.order.userId,
          targetType: "Order",
          targetId: current.orderId,
          action: input.status === "PAID" ? "USER_PAYMENT_PAID" : input.status === "EXPIRED" ? "USER_PAYMENT_EXPIRED" : "USER_PAYMENT_FAILED",
          oldData: {
            paymentTransactionStatus: current.status
          },
          newData: {
            paymentTransactionStatus: input.status,
            orderCode: input.orderCode,
            bankCode: input.bankCode ?? null,
            gatewayCode: input.gatewayCode ?? null,
            gatewayReference: input.gatewayReference ?? input.paymentLinkId ?? null,
            paidAt: input.paidAt ?? null
          }
        }
      });
      return true;
    });
    if (updated && lowStockNotifications.length > 0) {
      for (const payload of lowStockNotifications) {
        try {
          await this.lowStockNotificationProcessor.process(payload);
        } catch (error) {
          logger3.warn("Failed to process low-stock admin notification", {
            variantId: payload.variantId,
            orderCode: payload.orderCode,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    return updated;
  }
  mergeRawPayload(existing, patch) {
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      return {
        ...existing,
        ...patch
      };
    }
    return {
      previous: existing,
      ...patch
    };
  }
  async consumeStockForPaidOrder(tx, orderId, orderCode) {
    const lowStockNotifications = [];
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true }
    });
    const quantityByVariantId = /* @__PURE__ */ new Map();
    for (const item of items) {
      if (!item.variantId) continue;
      quantityByVariantId.set(
        item.variantId,
        (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity
      );
    }
    for (const [variantId, quantity] of quantityByVariantId.entries()) {
      const current = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: {
          stockOnHand: true,
          stockAvailable: true,
          stockReserved: true,
          minStock: true,
          sku: true,
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      if (!current) {
        continue;
      }
      const previousStockOnHand = current.stockOnHand;
      const nextStockOnHand = previousStockOnHand - quantity;
      const updated = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockOnHand: { gte: quantity },
          stockReserved: { gte: quantity }
        },
        data: {
          stockOnHand: { decrement: quantity },
          stockReserved: { decrement: quantity }
        }
      });
      if (updated.count === 0) {
        throw new BadRequestError(`Reserved stock is inconsistent for variant ${variantId}`);
      }
      await tx.inventoryLog.create({
        data: {
          variantId,
          action: "SALE",
          quantity,
          beforeQuantity: previousStockOnHand,
          afterQuantity: nextStockOnHand,
          referenceType: "ORDER",
          referenceId: orderId,
          reason: "Consume reserved inventory after online payment",
          salesChannel: "ONLINE"
        }
      });
      if (shouldNotifyLowStock(previousStockOnHand, nextStockOnHand, current.minStock)) {
        lowStockNotifications.push({
          orderId,
          orderCode,
          productId: current.product.id,
          productName: current.product.name,
          variantId,
          sku: current.sku,
          stockOnHand: nextStockOnHand,
          minStock: current.minStock
        });
      }
    }
    return lowStockNotifications;
  }
  async reserveStockForCheckout(tx, cartItems, orderId) {
    const quantityByVariantId = /* @__PURE__ */ new Map();
    for (const item of cartItems) {
      if (!item.variantId) {
        throw new Error("Cart item missing required variant");
      }
      quantityByVariantId.set(
        item.variantId,
        (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity
      );
    }
    for (const [variantId, quantity] of quantityByVariantId.entries()) {
      const current = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: {
          stockOnHand: true,
          stockAvailable: true,
          stockReserved: true,
          isDeleted: true,
          sku: true,
          product: { select: { isDeleted: true } }
        }
      });
      if (!current || current.isDeleted || current.product.isDeleted) {
        throw new BadRequestError("S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB x\xF3a");
      }
      const availableStock = current.stockOnHand - current.stockReserved;
      if (current.stockAvailable !== availableStock) {
        throw new BadRequestError(`L\u1ED7i t\u1ED3n kho`);
      }
      if (availableStock < quantity) {
        throw new BadRequestError(`L\u1ED7i t\u1ED3n kho`);
      }
      const reserved = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockOnHand: current.stockOnHand,
          stockReserved: current.stockReserved,
          stockAvailable: current.stockAvailable
        },
        data: {
          stockReserved: { increment: quantity },
          stockAvailable: { decrement: quantity }
        }
      });
      if (reserved.count !== 1) {
        throw new BadRequestError(`T\u1ED3n kho v\u1EEBa thay \u0111\u1ED5i cho SKU ${current.sku}, vui l\xF2ng th\u1EED l\u1EA1i`);
      }
      await tx.inventoryLog.create({
        data: {
          variantId,
          action: "RESERVE",
          quantity,
          beforeQuantity: current.stockOnHand,
          afterQuantity: current.stockOnHand,
          referenceType: "ORDER",
          referenceId: orderId,
          reason: "Reserve inventory for online checkout",
          salesChannel: "ONLINE"
        }
      });
    }
  }
  async releaseReservedStockForOrder(tx, orderId) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true }
    });
    const quantityByVariantId = /* @__PURE__ */ new Map();
    for (const item of items) {
      if (!item.variantId) continue;
      quantityByVariantId.set(
        item.variantId,
        (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity
      );
    }
    for (const [variantId, quantity] of quantityByVariantId.entries()) {
      const current = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stockReserved: true, stockAvailable: true, stockOnHand: true }
      });
      if (!current) continue;
      if (current.stockReserved < quantity) {
        throw new BadRequestError(`Reserved stock is inconsistent for variant ${variantId}`);
      }
      const updated = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockOnHand: current.stockOnHand,
          stockReserved: current.stockReserved,
          stockAvailable: current.stockAvailable
        },
        data: {
          stockReserved: { decrement: quantity },
          stockAvailable: { increment: quantity }
        }
      });
      if (updated.count === 0) {
        throw new BadRequestError(`Inventory changed while releasing variant ${variantId}`);
      }
      await tx.inventoryLog.create({
        data: {
          variantId,
          action: "RELEASE",
          quantity,
          beforeQuantity: current.stockOnHand,
          afterQuantity: current.stockOnHand,
          referenceType: "ORDER",
          referenceId: orderId,
          reason: "Release inventory after payment cancellation or expiration",
          salesChannel: "ONLINE"
        }
      });
    }
  }
  async removePurchasedCartItems(tx, orderId, paymentRawPayload) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true }
    });
    if (!order) {
      return;
    }
    const raw3 = paymentRawPayload && typeof paymentRawPayload === "object" && !Array.isArray(paymentRawPayload) ? paymentRawPayload : null;
    const checkout = raw3?.checkout && typeof raw3.checkout === "object" && !Array.isArray(raw3.checkout) ? raw3.checkout : null;
    const cartItemIds = checkout?.cartItemIds;
    if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      return;
    }
    const ids = cartItemIds.filter((id) => typeof id === "string");
    if (ids.length === 0) {
      return;
    }
    await tx.cartItem.deleteMany({
      where: {
        id: { in: ids },
        cart: {
          userId: order.userId
        }
      }
    });
  }
};

// src/module/voucher/infrastructure/api/voucher.api.ts
import express from "express";

// src/shared/server/error-middleware.ts
var logger4 = createLogger("ErrorMiddleware");

// src/module/voucher/infrastructure/api/public-voucher.api.ts
import express2 from "express";

// src/module/voucher/applications/services/voucher-rules.service.ts
var VoucherRulesService = class {
  static isItemEligible(voucher, item, memberTier) {
    const categoryIds = voucher.includeDescendants ? [...item.categoryIds, ...item.ancestorCategoryIds] : item.categoryIds;
    const excluded = (voucher.excludedProductIds ?? []).includes(item.productId) || categoryIds.some((id) => (voucher.excludedCategoryIds ?? []).includes(id));
    if (excluded) return false;
    if (voucher.scopeType === "ALL_PRODUCTS") return true;
    if (voucher.scopeType === "INCLUDE_PRODUCTS") return (voucher.includedProductIds ?? []).includes(item.productId);
    if (voucher.scopeType === "INCLUDE_CATEGORIES") return categoryIds.some((id) => (voucher.includedCategoryIds ?? []).includes(id));
    if (voucher.scopeType === "MEMBER_TIERS") return (voucher.memberTiers ?? []).includes(memberTier);
    return true;
  }
  static ensureVoucherIsApplicable(voucher, subtotal) {
    const now = /* @__PURE__ */ new Date();
    if (!voucher.isActive) {
      throw new BadRequestError("Voucher is inactive");
    }
    if (now < voucher.startAt || now > voucher.endAt) {
      throw new BadRequestError("Voucher is not in active time range");
    }
    if (voucher.maxUsage !== null && voucher.usedCount >= voucher.maxUsage) {
      throw new BadRequestError("Voucher usage limit exceeded");
    }
    if (voucher.minOrderAmount !== null && subtotal < voucher.minOrderAmount) {
      throw new BadRequestError("Order total does not meet minimum value for voucher");
    }
    if (voucher.type === "PERCENTAGE" && (!voucher.maxDiscount || voucher.maxDiscount <= 0)) {
      throw new BadRequestError("Voucher configuration invalid: maxDiscount is required");
    }
  }
  static calculatePrice(type, value, input) {
    let discountAmount = 0;
    if (type === "PERCENTAGE") {
      discountAmount = input.subtotal * value / 100;
      if (input.maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, input.maxDiscount);
      }
    } else {
      discountAmount = value;
    }
    discountAmount = Math.min(discountAmount, input.subtotal);
    discountAmount = Math.max(0, Math.round(discountAmount));
    return {
      subtotal: Math.round(input.subtotal),
      discountAmount,
      finalTotal: Math.max(0, Math.round(input.subtotal - discountAmount))
    };
  }
};

// src/module/user-profile/loyalty-benefits.ts
var LOYALTY_TIER_BENEFITS = {
  MEMBER: {
    label: "Th\xE0nh vi\xEAn",
    discountPercent: 0,
    birthdayVoucherLabel: "Voucher sinh nh\u1EADt c\u01A1 b\u1EA3n"
  },
  SILVER: {
    label: "B\u1EA1c",
    discountPercent: 2,
    birthdayVoucherLabel: "Voucher sinh nh\u1EADt h\u1EA1ng B\u1EA1c"
  },
  GOLD: {
    label: "V\xE0ng",
    discountPercent: 5,
    birthdayVoucherLabel: "Voucher sinh nh\u1EADt h\u1EA1ng V\xE0ng"
  }
};
function normalizeLoyaltyTier(tier) {
  if (tier === "SILVER" || tier === "GOLD") return tier;
  return "MEMBER";
}
function calculateLoyaltyDiscount(params) {
  const tier = normalizeLoyaltyTier(params.tier);
  const benefit = LOYALTY_TIER_BENEFITS[tier];
  return {
    tier,
    tierLabel: benefit.label,
    discountPercent: 0,
    discountAmount: 0
  };
}

// src/module/promotion/promotion-pricing.service.ts
function toMoney(value) {
  return Math.max(0, Math.round(Number(value ?? 0)));
}
function isEligible(promotion, item) {
  if (promotion.scopeType === "ALL_PRODUCTS") return true;
  if (promotion.scopeType === "INCLUDE_PRODUCTS") {
    return (promotion.includedProducts ?? []).some((row) => row.productId === item.productId);
  }
  const categoryIds = promotion.includeDescendants ? [...item.categoryIds, ...item.ancestorCategoryIds] : item.categoryIds;
  return categoryIds.some(
    (id) => (promotion.includedCategories ?? []).some((row) => row.categoryId === id)
  );
}
function calculateLineDiscount(promotion, lineSubtotal, unitPrice, quantity) {
  const value = toMoney(promotion.value);
  let discount = 0;
  if (promotion.type === "PERCENTAGE") {
    discount = Math.floor(lineSubtotal * value / 100);
    const maxDiscount = promotion.maxDiscount === null ? null : toMoney(promotion.maxDiscount);
    if (maxDiscount !== null && maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  } else if (promotion.type === "FIXED_AMOUNT") {
    discount = value;
  } else if (promotion.type === "SALE_PRICE") {
    discount = Math.max(0, (unitPrice - value) * quantity);
  } else {
    discount = 0;
  }
  return Math.min(lineSubtotal, Math.max(0, Math.round(discount)));
}
var PromotionPricingService = class {
  async calculateForCart(params) {
    const now = params.now ?? /* @__PURE__ */ new Date();
    const promotions = await params.tx.promotion.findMany({
      where: {
        status: { in: ["ACTIVE", "SCHEDULED"] },
        startAt: { lte: now },
        endAt: { gte: now }
      },
      include: {
        includedProducts: true,
        includedCategories: true
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }]
    });
    const allocations = params.items.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity;
      let best = {
        cartItemId: item.id,
        promotionId: null,
        promotionName: null,
        discountAmount: 0,
        stackableWithVoucher: true,
        snapshot: null
      };
      for (const promotion of promotions) {
        if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) continue;
        if (!isEligible(promotion, item)) continue;
        const discountAmount = calculateLineDiscount(
          promotion,
          lineSubtotal,
          item.unitPrice,
          item.quantity
        );
        if (discountAmount <= 0) continue;
        const shouldReplace = discountAmount > best.discountAmount || discountAmount === best.discountAmount && best.promotionId === null;
        if (shouldReplace) {
          best = {
            cartItemId: item.id,
            promotionId: promotion.id,
            promotionName: promotion.name,
            discountAmount,
            stackableWithVoucher: promotion.stackableWithVoucher,
            snapshot: {
              id: promotion.id,
              name: promotion.name,
              type: promotion.type,
              value: toMoney(promotion.value),
              priority: promotion.priority,
              stackableWithVoucher: promotion.stackableWithVoucher
            }
          };
        }
      }
      return best;
    });
    return {
      allocations,
      totalDiscount: allocations.reduce((sum, item) => sum + item.discountAmount, 0)
    };
  }
  async recordUsageForOrder(tx, orderId) {
    const rows = await tx.orderItem.groupBy({
      by: ["promotionId"],
      where: { orderId, promotionId: { not: null }, promotionDiscountAmount: { gt: 0 } },
      _sum: { promotionDiscountAmount: true }
    });
    for (const row of rows) {
      if (!row.promotionId) continue;
      const idempotencyKey = `PROMOTION:${row.promotionId}:ORDER:${orderId}`;
      const exists = await tx.promotionUsage.findUnique({ where: { idempotencyKey } });
      if (exists) continue;
      const incremented = await tx.$executeRaw`
        UPDATE promotions
        SET used_count = used_count + 1
        WHERE id = ${row.promotionId}
          AND (usage_limit IS NULL OR used_count < usage_limit)
      `;
      if (incremented !== 1) continue;
      await tx.promotionUsage.create({
        data: {
          promotionId: row.promotionId,
          orderId,
          discountAmount: row._sum.promotionDiscountAmount ?? 0,
          idempotencyKey
        }
      });
    }
  }
};

// src/module/voucher/applications/services/birthday-voucher-rules.service.ts
function getBirthdayYear(now = /* @__PURE__ */ new Date()) {
  return now.getFullYear();
}
function isBirthdayToday(birthday, now = /* @__PURE__ */ new Date()) {
  if (!birthday) return false;
  return birthday.getMonth() === now.getMonth() && birthday.getDate() === now.getDate();
}
function assertBirthdayVoucherCanBeUsed(params) {
  const now = params.now ?? /* @__PURE__ */ new Date();
  if (!isBirthdayToday(params.birthday, now)) {
    throw new BadRequestError("Voucher sinh nh\u1EADt ch\u1EC9 \xE1p d\u1EE5ng \u0111\xFAng ng\xE0y sinh nh\u1EADt c\u1EE7a b\u1EA1n");
  }
  if (params.usageCountForYear > 0) {
    throw new BadRequestError("Voucher sinh nh\u1EADt n\u0103m nay \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng");
  }
}

// src/module/voucher/infrastructure/repositories/prisma-voucher.repository.ts
var PrismaVoucherRepository = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  async findActive(now) {
    const rows = await this.prisma.discount.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now }
      },
      orderBy: [{ endAt: "asc" }, { createdAt: "desc" }],
      include: { includedCategories: true, excludedCategories: true, includedProducts: true, excludedProducts: true, memberTiers: true }
    });
    return rows.map((row) => this.toSummary(row));
  }
  async findByCode(code, tx) {
    const client = tx ?? this.prisma;
    const row = await client.discount.findUnique({ where: { code: code.trim().toUpperCase() }, include: { includedCategories: true, excludedCategories: true, includedProducts: true, excludedProducts: true, memberTiers: true } });
    return row ? this.toSummary(row) : null;
  }
  async countUserUsage(discountId, userId, tx) {
    const client = tx ?? this.prisma;
    return client.discountUsage.count({ where: { discountId, userId } });
  }
  async countUserUsageForYear(discountId, userId, year, tx) {
    const client = tx ?? this.prisma;
    return client.discountUsage.count({ where: { discountId, userId, usageYear: year } });
  }
  async countUserVoucherOrdersForYear(discountId, userId, year, tx) {
    const client = tx ?? this.prisma;
    return client.order.count({
      where: {
        discountId,
        userId,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        },
        status: { notIn: ["CANCELLED", "RETURNED"] },
        OR: [
          { payment: null },
          { payment: { status: { notIn: ["FAILED", "EXPIRED"] } } }
        ]
      }
    });
  }
  async getCartTotals(userId, cartItemIds, tx) {
    const client = tx ?? this.prisma;
    const cart = await client.cart.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!cart) {
      throw new BadRequestError("Cart not found for checkout");
    }
    const items = await client.cartItem.findMany({
      where: {
        cartId: cart.id,
        ...cartItemIds && cartItemIds.length > 0 ? { id: { in: cartItemIds } } : {}
      },
      select: {
        id: true,
        productId: true,
        variantId: true,
        quantity: true,
        variant: { select: { price: true } },
        product: { select: { categories: { select: { categoryId: true } } } }
      }
    });
    if (items.length === 0) {
      throw new BadRequestError("Cart is empty");
    }
    const categories = await client.category.findMany({ select: { id: true, parentId: true } });
    const parentById = new Map(categories.map((category) => [category.id, category.parentId]));
    const ancestorsOf = (ids) => {
      const result = /* @__PURE__ */ new Set();
      for (const id of ids) {
        let parent = parentById.get(id);
        while (parent && !result.has(parent)) {
          result.add(parent);
          parent = parentById.get(parent);
        }
      }
      return [...result];
    };
    const normalizedItems = items.map((item) => {
      if (!item.variantId || !item.variant) {
        throw new BadRequestError(`Cart item ${item.id} missing required variant`);
      }
      const categoryIds = item.product.categories.map((row) => row.categoryId);
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.variant.price),
        categoryIds,
        ancestorCategoryIds: ancestorsOf(categoryIds)
      };
    });
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const [account, user] = await Promise.all([
      client.loyaltyAccount.findUnique({ where: { userId }, select: { tier: true } }),
      client.user.findUnique({ where: { id: userId }, select: { birthday: true } })
    ]);
    return {
      cartId: cart.id,
      subtotal,
      items: normalizedItems,
      memberTier: account?.tier ?? "MEMBER",
      userBirthday: user?.birthday ?? null
    };
  }
  async getOrderVoucher(orderId, tx) {
    const row = await tx.order.findUnique({
      where: { id: orderId },
      select: { discountId: true, userId: true, discount: { include: { includedCategories: true, excludedCategories: true, includedProducts: true, excludedProducts: true, memberTiers: true } } }
    });
    return row ? {
      discountId: row.discountId,
      userId: row.userId,
      discount: row.discount ? this.toSummary(row.discount) : null
    } : null;
  }
  async hasDiscountUsage(orderId, tx) {
    const row = await tx.discountUsage.findUnique({
      where: { orderId },
      select: { id: true }
    });
    return Boolean(row);
  }
  async createDiscountUsage(params) {
    await params.tx.discountUsage.create({
      data: {
        discountId: params.discountId,
        userId: params.userId,
        orderId: params.orderId,
        usageYear: params.usageYear ?? null
      }
    });
  }
  async incrementUsedCountIfAvailable(discountId, tx) {
    const now = /* @__PURE__ */ new Date();
    const updated = await tx.discount.updateMany({
      where: {
        id: discountId,
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
        OR: [{ maxUsage: null }, { usedCount: { lt: tx.discount.fields.maxUsage } }]
      },
      data: { usedCount: { increment: 1 } }
    });
    return updated.count > 0;
  }
  toSummary(row) {
    return {
      id: row.id,
      code: row.code,
      description: row.description,
      type: row.type,
      value: Number(row.value),
      maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
      minOrderAmount: row.minOrderAmount ? Number(row.minOrderAmount) : null,
      maxUsage: row.maxUsage,
      userUsageLimit: row.userUsageLimit,
      usedCount: row.usedCount,
      startAt: row.startAt,
      endAt: row.endAt,
      isActive: row.isActive,
      isBirthdayVoucher: row.isBirthdayVoucher ?? false,
      bannerImageUrl: row.bannerImageUrl,
      scopeType: row.scopeType,
      includeDescendants: row.includeDescendants,
      minAmountBasis: row.minAmountBasis,
      includedCategoryIds: row.includedCategories?.map((item) => item.categoryId) ?? [],
      excludedCategoryIds: row.excludedCategories?.map((item) => item.categoryId) ?? [],
      includedProductIds: row.includedProducts?.map((item) => item.productId) ?? [],
      excludedProductIds: row.excludedProducts?.map((item) => item.productId) ?? [],
      memberTiers: row.memberTiers?.map((item) => item.tier) ?? []
    };
  }
};

// src/module/voucher/applications/services/voucher-checkout.service.ts
var VoucherCheckoutService = class {
  constructor(voucherRepository) {
    this.voucherRepository = voucherRepository;
  }
  promotionPricingService = new PromotionPricingService();
  async calculateForCheckout(params) {
    const cartTotals = await this.voucherRepository.getCartTotals(
      params.userId,
      params.cartItemIds,
      params.tx
    );
    const promotionPricing = params.tx ? await this.promotionPricingService.calculateForCart({
      tx: params.tx,
      items: cartTotals.items
    }) : { totalDiscount: 0, allocations: [] };
    const promotionByItemId = new Map(
      promotionPricing.allocations.map((allocation) => [allocation.cartItemId, allocation])
    );
    const promotionDiscountAmount = promotionPricing.totalDiscount;
    let voucherDiscountAmount = 0;
    let payableAmount = Math.round(cartTotals.subtotal - promotionDiscountAmount);
    let appliedVoucherId;
    let appliedVoucherCode;
    let itemDiscounts = cartTotals.items.map((item) => {
      const promotion = promotionByItemId.get(item.id) ?? null;
      return {
        cartItemId: item.id,
        eligible: false,
        discountAmount: promotion?.discountAmount ?? 0,
        promotionDiscountAmount: promotion?.discountAmount ?? 0,
        voucherDiscountAmount: 0,
        loyaltyDiscountAmount: 0,
        promotion
      };
    });
    if (params.voucherCode) {
      const voucher = await this.voucherRepository.findByCode(params.voucherCode, params.tx);
      if (!voucher) {
        throw new BadRequestError("Voucher does not exist");
      }
      if (voucher.isBirthdayVoucher) {
        const year = getBirthdayYear();
        const usageCount = await this.voucherRepository.countUserUsageForYear(
          voucher.id,
          params.userId,
          year,
          params.tx
        );
        const orderCount = await this.voucherRepository.countUserVoucherOrdersForYear(
          voucher.id,
          params.userId,
          year,
          params.tx
        );
        assertBirthdayVoucherCanBeUsed({
          birthday: cartTotals.userBirthday,
          usageCountForYear: usageCount + orderCount
        });
      }
      const voucherBaseItems = cartTotals.items.map((item) => {
        const promotion = promotionByItemId.get(item.id);
        const lineSubtotal = item.unitPrice * item.quantity;
        const promotionDiscount = promotion?.discountAmount ?? 0;
        const unitPriceAfterPromotion = Math.max(
          0,
          Math.floor((lineSubtotal - promotionDiscount) / item.quantity)
        );
        return {
          ...item,
          unitPrice: promotion?.stackableWithVoucher === false ? 0 : unitPriceAfterPromotion
        };
      });
      const eligibleItems = voucherBaseItems.filter((item) => VoucherRulesService.isItemEligible(voucher, item, cartTotals.memberTier));
      const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      if (eligibleSubtotal <= 0) throw new BadRequestError("Voucher is not eligible for any cart item");
      const minimumBasis = voucher.minAmountBasis === "CART_SUBTOTAL" ? cartTotals.subtotal : eligibleSubtotal;
      VoucherRulesService.ensureVoucherIsApplicable(voucher, minimumBasis);
      const userUsageCount = await this.voucherRepository.countUserUsage(
        voucher.id,
        params.userId,
        params.tx
      );
      if (voucher.userUsageLimit !== null && userUsageCount >= voucher.userUsageLimit) {
        throw new BadRequestError("Voucher usage limit per user exceeded");
      }
      const pricing = VoucherRulesService.calculatePrice(voucher.type, voucher.value, {
        subtotal: eligibleSubtotal,
        maxDiscount: voucher.maxDiscount
      });
      voucherDiscountAmount = pricing.discountAmount;
      payableAmount = Math.round(cartTotals.subtotal - promotionDiscountAmount - pricing.discountAmount);
      let allocated = 0;
      itemDiscounts = cartTotals.items.map((item) => {
        const promotion = promotionByItemId.get(item.id) ?? null;
        const promotionLineDiscount = promotion?.discountAmount ?? 0;
        const eligible = eligibleItems.some((candidate) => candidate.id === item.id);
        if (!eligible) {
          return {
            cartItemId: item.id,
            eligible: false,
            discountAmount: promotionLineDiscount,
            promotionDiscountAmount: promotionLineDiscount,
            voucherDiscountAmount: 0,
            loyaltyDiscountAmount: 0,
            promotion
          };
        }
        const voucherBaseItem = eligibleItems.find((candidate) => candidate.id === item.id) ?? item;
        const lineSubtotal = voucherBaseItem.unitPrice * item.quantity;
        const isLast = item.id === eligibleItems[eligibleItems.length - 1]?.id;
        const voucherLineDiscount = isLast ? pricing.discountAmount - allocated : Math.floor(pricing.discountAmount * lineSubtotal / eligibleSubtotal);
        allocated += voucherLineDiscount;
        return {
          cartItemId: item.id,
          eligible: true,
          discountAmount: promotionLineDiscount + voucherLineDiscount,
          promotionDiscountAmount: promotionLineDiscount,
          voucherDiscountAmount: voucherLineDiscount,
          loyaltyDiscountAmount: 0,
          promotion
        };
      });
      appliedVoucherId = voucher.id;
      appliedVoucherCode = voucher.code;
    }
    const loyalty = calculateLoyaltyDiscount({
      tier: cartTotals.memberTier,
      amount: payableAmount
    });
    let allocatedLoyalty = 0;
    if (loyalty.discountAmount > 0) {
      const discountableItems = itemDiscounts.map((item) => {
        const cartItem = cartTotals.items.find((candidate) => candidate.id === item.cartItemId);
        const lineSubtotal = cartItem ? cartItem.unitPrice * cartItem.quantity : 0;
        const lineAfterDiscount = Math.max(0, lineSubtotal - item.discountAmount);
        return { ...item, lineAfterDiscount };
      }).filter((item) => item.lineAfterDiscount > 0);
      const discountableSubtotal = discountableItems.reduce(
        (sum, item) => sum + item.lineAfterDiscount,
        0
      );
      const lastId = discountableItems[discountableItems.length - 1]?.cartItemId;
      itemDiscounts = itemDiscounts.map((item) => {
        const discountable = discountableItems.find(
          (candidate) => candidate.cartItemId === item.cartItemId
        );
        if (!discountable || discountableSubtotal <= 0) return item;
        const loyaltyLineDiscount = item.cartItemId === lastId ? loyalty.discountAmount - allocatedLoyalty : Math.floor(loyalty.discountAmount * discountable.lineAfterDiscount / discountableSubtotal);
        allocatedLoyalty += loyaltyLineDiscount;
        return {
          ...item,
          discountAmount: item.discountAmount + loyaltyLineDiscount,
          loyaltyDiscountAmount: loyaltyLineDiscount
        };
      });
    }
    payableAmount = Math.max(0, payableAmount - loyalty.discountAmount);
    const discountAmount = promotionDiscountAmount + voucherDiscountAmount + loyalty.discountAmount;
    if (params.amount !== void 0 && payableAmount !== Math.round(params.amount)) {
      throw new BadRequestError("Checkout amount is outdated. Please refresh and try again.");
    }
    return {
      subtotalAmount: Math.round(cartTotals.subtotal),
      promotionDiscountAmount,
      voucherDiscountAmount,
      loyaltyDiscountAmount: loyalty.discountAmount,
      loyaltyDiscountPercent: loyalty.discountPercent,
      loyaltyTier: loyalty.tier,
      loyaltyTierLabel: loyalty.tierLabel,
      discountAmount,
      payableAmount,
      appliedVoucherId,
      appliedVoucherCode,
      cartId: cartTotals.cartId,
      itemIds: cartTotals.items.map((item) => item.id),
      itemDiscounts
    };
  }
  async recordUsageForPaidOrder(tx, orderId) {
    const order = await this.voucherRepository.getOrderVoucher(orderId, tx);
    if (!order?.discountId) {
      return;
    }
    const exists = await this.voucherRepository.hasDiscountUsage(orderId, tx);
    if (exists) {
      return;
    }
    if (!order.discount) {
      throw new BadRequestError("Voucher does not exist");
    }
    const now = /* @__PURE__ */ new Date();
    if (!order.discount.isActive) {
      throw new BadRequestError("Voucher is inactive");
    }
    if (now < order.discount.startAt || now > order.discount.endAt) {
      throw new BadRequestError("Voucher is not in active time range");
    }
    const incremented = await this.voucherRepository.incrementUsedCountIfAvailable(
      order.discountId,
      tx
    );
    if (!incremented) {
      throw new BadRequestError("Voucher usage limit exceeded");
    }
    const userUsageCount = await this.voucherRepository.countUserUsage(
      order.discountId,
      order.userId,
      tx
    );
    if (order.discount.userUsageLimit !== null && userUsageCount >= order.discount.userUsageLimit) {
      throw new BadRequestError("Voucher usage limit per user exceeded");
    }
    const usageYear = order.discount?.isBirthdayVoucher ? getBirthdayYear() : null;
    await this.voucherRepository.createDiscountUsage({
      discountId: order.discountId,
      userId: order.userId,
      orderId,
      usageYear,
      tx
    });
  }
  async recordPromotionUsageForPaidOrder(tx, orderId) {
    await this.promotionPricingService.recordUsageForOrder(tx, orderId);
  }
};

// src/module/voucher/di.ts
function createVoucherCheckoutService() {
  const voucherRepository = new PrismaVoucherRepository(prisma);
  return new VoucherCheckoutService(voucherRepository);
}

// src/infrastructure/messaging/rabbitmq.service.ts
import amqp from "amqplib";
var logger5 = createLogger("RabbitMQService");
var RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
var PAYMENT_EVENTS_EXCHANGE = process.env.RABBITMQ_PAYMENT_EXCHANGE || "shop_events";
var PAYMENT_SUCCESS_ROUTING_KEY = process.env.RABBITMQ_PAYMENT_SUCCESS_ROUTING_KEY || "order.payment.success";
var PAYMENT_SUCCESS_QUEUE = process.env.RABBITMQ_ADMIN_NOTIFICATION_QUEUE || "admin_notification_q";
var PAYMENT_SUCCESS_DLX = process.env.RABBITMQ_ADMIN_NOTIFICATION_DLX || "admin_notification_dlx";
var PAYMENT_SUCCESS_DLQ = process.env.RABBITMQ_ADMIN_NOTIFICATION_DLQ || "admin_notification_dlq";
var RabbitMQService = class {
  connection = null;
  channel = null;
  consumeStarted = false;
  async getChannel() {
    if (this.channel) {
      return this.channel;
    }
    const connection = await amqp.connect(RABBITMQ_URL);
    this.connection = connection;
    connection.on("close", () => {
      logger5.warn("RabbitMQ connection closed");
      this.connection = null;
      this.channel = null;
      this.consumeStarted = false;
    });
    connection.on("error", (error) => {
      logger5.error("RabbitMQ connection error", {
        error: error instanceof Error ? error.message : String(error)
      });
    });
    const channel = await connection.createChannel();
    this.channel = channel;
    await channel.prefetch(10);
    await this.setupTopology(channel);
    logger5.info("RabbitMQ channel initialized", {
      exchange: PAYMENT_EVENTS_EXCHANGE,
      queue: PAYMENT_SUCCESS_QUEUE,
      dlq: PAYMENT_SUCCESS_DLQ
    });
    return channel;
  }
  async setupTopology(channel) {
    await channel.assertExchange(PAYMENT_EVENTS_EXCHANGE, "topic", { durable: true });
    await channel.assertExchange(PAYMENT_SUCCESS_DLX, "topic", { durable: true });
    await channel.assertQueue(PAYMENT_SUCCESS_DLQ, { durable: true });
    await channel.bindQueue(PAYMENT_SUCCESS_DLQ, PAYMENT_SUCCESS_DLX, PAYMENT_SUCCESS_ROUTING_KEY);
    await channel.assertQueue(PAYMENT_SUCCESS_QUEUE, {
      durable: true,
      deadLetterExchange: PAYMENT_SUCCESS_DLX,
      deadLetterRoutingKey: PAYMENT_SUCCESS_ROUTING_KEY
    });
    await channel.bindQueue(
      PAYMENT_SUCCESS_QUEUE,
      PAYMENT_EVENTS_EXCHANGE,
      PAYMENT_SUCCESS_ROUTING_KEY
    );
  }
  async publishPaymentSuccess(event) {
    const channel = await this.getChannel();
    const payload = Buffer.from(JSON.stringify(event));
    const ok = channel.publish(PAYMENT_EVENTS_EXCHANGE, PAYMENT_SUCCESS_ROUTING_KEY, payload, {
      contentType: "application/json",
      deliveryMode: 2,
      timestamp: Date.now()
    });
    if (!ok) {
      logger5.warn("RabbitMQ publish buffer full, message queued in memory");
    }
  }
  async consumePaymentSuccess(handler) {
    if (this.consumeStarted) {
      return;
    }
    const channel = await this.getChannel();
    this.consumeStarted = true;
    await channel.consume(PAYMENT_SUCCESS_QUEUE, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handler(payload);
        channel.ack(msg);
      } catch (error) {
        logger5.error("RabbitMQ consumer failed to process message", {
          error: error instanceof Error ? error.message : String(error)
        });
        channel.nack(msg, false, false);
      }
    });
    logger5.info("RabbitMQ consumer started", {
      queue: PAYMENT_SUCCESS_QUEUE
    });
  }
};
var rabbitMQService = new RabbitMQService();

// src/module/admin/notifications/infrastructure/services/admin-payment-notification.processor.ts
var logger6 = createLogger("AdminPaymentNotificationProcessor");
var AdminPaymentNotificationProcessor = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  async process(input) {
    const dedupeKey = `notify:admin:payment-success:${input.orderId}`;
    const lockResult = await redis.set(
      dedupeKey,
      input.paidAt.toISOString(),
      "EX",
      60 * 60 * 24 * 7,
      "NX"
    );
    if (lockResult !== "OK") {
      return false;
    }
    try {
      const admins = await this.prisma.userRole.findMany({
        where: {
          role: {
            code: "ADMIN"
          }
        },
        select: {
          userId: true
        },
        distinct: ["userId"]
      });
      if (admins.length === 0) {
        return false;
      }
      const amountText = new Intl.NumberFormat("vi-VN").format(input.amount);
      const content = `\u0110\u01A1n h\xE0ng #${input.orderCode} \u0111\xE3 thanh to\xE1n th\xE0nh c\xF4ng (${amountText} VND)`;
      const createdRows = await this.prisma.$transaction(
        admins.map(
          (admin) => this.prisma.notification.create({
            data: {
              userId: admin.userId,
              content,
              isRead: false
            },
            select: {
              id: true,
              content: true,
              isRead: true,
              createdAt: true,
              userId: true
            }
          })
        )
      );
      for (const row of createdRows) {
        adminNotificationHub.sendPaymentSuccess(row.userId, {
          id: row.id,
          content: row.content,
          isRead: row.isRead,
          createdAt: row.createdAt.toISOString()
        });
      }
      await this.prisma.auditLog.create({
        data: {
          actorType: "SYSTEM",
          targetType: "Order",
          targetId: input.orderId,
          action: "ADMIN_PAYMENT_NOTIFICATION_SENT",
          newData: {
            orderCode: input.orderCode,
            amount: input.amount,
            paidAt: input.paidAt,
            receivers: createdRows.length
          }
        }
      });
      logger6.info("Admin notifications sent for paid order", {
        orderCode: input.orderCode,
        receivers: createdRows.length
      });
      return true;
    } catch (error) {
      await redis.del(dedupeKey);
      throw error;
    }
  }
};

// src/module/admin/notifications/infrastructure/services/admin-new-order-notification.processor.ts
var logger7 = createLogger("AdminNewOrderNotificationProcessor");
var AdminNewOrderNotificationProcessor = class {
  constructor(prisma2) {
    this.prisma = prisma2;
  }
  async process(input) {
    const dedupeKey = `notify:admin:new-order:${input.orderId}`;
    const lockResult = await redis.set(
      dedupeKey,
      input.paidAt.toISOString(),
      "EX",
      60 * 60 * 24 * 7,
      "NX"
    );
    if (lockResult !== "OK") {
      return false;
    }
    try {
      const admins = await this.prisma.userRole.findMany({
        where: {
          role: {
            code: "ADMIN"
          }
        },
        select: {
          userId: true
        },
        distinct: ["userId"]
      });
      if (admins.length === 0) {
        return false;
      }
      const amountText = new Intl.NumberFormat("vi-VN").format(input.totalAmount);
      const customerText = input.customerName?.trim() ? ` t\u1EEB kh\xE1ch h\xE0ng ${input.customerName.trim()}` : "";
      const content = `[NEW_ORDER|${input.orderId}] \u0110\u01A1n h\xE0ng m\u1EDBi #${input.orderCode}${customerText} (${amountText} VND)`;
      const createdRows = await this.prisma.$transaction(
        admins.map(
          (admin) => this.prisma.notification.create({
            data: {
              userId: admin.userId,
              content,
              isRead: false
            },
            select: {
              id: true,
              userId: true,
              content: true,
              isRead: true,
              createdAt: true
            }
          })
        )
      );
      for (const row of createdRows) {
        adminNotificationHub.sendNewOrder(row.userId, {
          id: row.id,
          content: row.content,
          isRead: row.isRead,
          createdAt: row.createdAt.toISOString(),
          type: "NEW_ORDER",
          orderId: input.orderId,
          orderCode: input.orderCode,
          customerName: input.customerName?.trim() || null,
          totalAmount: input.totalAmount
        });
      }
      await this.prisma.auditLog.create({
        data: {
          actorType: "SYSTEM",
          targetType: "Order",
          targetId: input.orderId,
          action: "ADMIN_NEW_ORDER_NOTIFICATION_SENT",
          newData: {
            orderCode: input.orderCode,
            customerName: input.customerName?.trim() || null,
            totalAmount: input.totalAmount,
            paidAt: input.paidAt,
            receivers: createdRows.length
          }
        }
      });
      logger7.info("Admin notifications sent for new order", {
        orderId: input.orderId,
        orderCode: input.orderCode,
        receivers: createdRows.length
      });
      return true;
    } catch (error) {
      await redis.del(dedupeKey);
      throw error;
    }
  }
};

// src/module/payment/infrastructure/notifiers/admin-payment-success.notifier.ts
var logger8 = createLogger("AdminPaymentSuccessNotifier");
var AdminPaymentSuccessNotifier = class {
  constructor(prisma2) {
    this.prisma = prisma2;
    this.processor = new AdminPaymentNotificationProcessor(prisma2);
    this.newOrderProcessor = new AdminNewOrderNotificationProcessor(prisma2);
  }
  processor;
  newOrderProcessor;
  async notify(input) {
    try {
      await rabbitMQService.publishPaymentSuccess({
        orderId: input.orderId,
        orderCode: input.orderCode,
        amount: input.amount,
        paidAt: input.paidAt.toISOString()
      });
    } catch (error) {
      logger8.warn("RabbitMQ publish failed, fallback to direct processor", {
        orderCode: input.orderCode,
        error: error instanceof Error ? error.message : String(error)
      });
      await this.processor.process(input);
      await this.newOrderProcessor.process({
        orderId: input.orderId,
        orderCode: input.orderCode,
        totalAmount: input.amount,
        paidAt: input.paidAt
      });
    }
  }
};

// src/payos-reconcile-worker.ts
var logger9 = createLogger("PayosReconcileWorker");
function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return Math.min(max, Math.max(min, i));
}
function getConfig() {
  return {
    intervalMs: clampInt(process.env.PAYOS_RECONCILE_INTERVAL_MS, 6e4, 5e3, 10 * 6e4),
    batchSize: clampInt(process.env.PAYOS_RECONCILE_BATCH_SIZE, 50, 1, 500),
    concurrency: clampInt(process.env.PAYOS_RECONCILE_CONCURRENCY, 6, 1, 25),
    minAgeSeconds: clampInt(process.env.PAYOS_RECONCILE_MIN_AGE_SECONDS, 30, 0, 60 * 10),
    pendingExpireMinutes: clampInt(
      process.env.PAYOS_PENDING_EXPIRE_MINUTES,
      30,
      1,
      24 * 60
    ),
    lockKey: process.env.PAYOS_RECONCILE_LOCK_KEY?.trim() || "locks:payos-reconcile",
    lockTtlMs: clampInt(process.env.PAYOS_RECONCILE_LOCK_TTL_MS, 55e3, 5e3, 10 * 6e4)
  };
}
function createLockValue() {
  return `${process.pid}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}
async function acquireLock(key, value, ttlMs) {
  const result = await redis.set(key, value, "PX", ttlMs, "NX");
  return result === "OK";
}
async function releaseLock(key, value) {
  const lua = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  try {
    await redis.eval(lua, 1, key, value);
  } catch (err) {
    logger9.warn("Failed to release redis lock (will expire by TTL)", {
      key,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
async function mapWithConcurrency(items, concurrency, fn) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      await fn(items[current]);
    }
  });
  await Promise.all(workers);
}
async function reconcileOnce(config2) {
  const lockValue = createLockValue();
  const hasLock = await acquireLock(config2.lockKey, lockValue, config2.lockTtlMs);
  if (!hasLock) {
    logger9.info("Skip tick: lock is held by another worker", { lockKey: config2.lockKey });
    return;
  }
  const startedAt = Date.now();
  try {
    const now = Date.now();
    const maxCreatedAt = new Date(now - config2.minAgeSeconds * 1e3);
    const localExpireBefore = new Date(now - config2.pendingExpireMinutes * 60 * 1e3);
    const pending = await prisma.paymentTransaction.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lte: maxCreatedAt
        }
      },
      select: {
        orderCode: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "asc"
      },
      take: config2.batchSize
    });
    if (pending.length === 0) {
      logger9.info("No pending transactions to reconcile");
      return;
    }
    const voucherCheckoutService = createVoucherCheckoutService();
    const paymentRepository = new PrismaPaymentRepository(prisma, voucherCheckoutService);
    const paymentSuccessNotifier = new AdminPaymentSuccessNotifier(prisma);
    const payos = getPayosClient();
    let updatedCount = 0;
    let checkedCount = 0;
    let localExpiredCount = 0;
    await mapWithConcurrency(pending, config2.concurrency, async (tx) => {
      checkedCount += 1;
      const orderCode = tx.orderCode;
      try {
        const paymentLink = await payos.paymentRequests.get(Number(orderCode));
        const isPaid = paymentLink.status === "PAID";
        const isExpired = paymentLink.status === "EXPIRED";
        const isTerminalFailure = ["FAILED", "CANCELLED", "EXPIRED"].includes(paymentLink.status);
        if (!isPaid && !isTerminalFailure) {
          if (tx.createdAt > localExpireBefore) {
            return;
          }
          const locallyExpired = await paymentRepository.updateFromWebhookIfPending({
            orderCode,
            status: "EXPIRED",
            paymentLinkId: paymentLink.id ?? null,
            gatewayReference: paymentLink?.reference ?? null,
            gatewayCode: "LOCAL_EXP",
            bankCode: paymentLink?.counterAccountBankId ?? null,
            paidAt: null,
            rawPayload: {
              source: "cron-local-expiry",
              reason: "PENDING payment exceeded local reservation window",
              pendingExpireMinutes: config2.pendingExpireMinutes,
              paymentLink
            }
          });
          if (locallyExpired) {
            updatedCount += 1;
            localExpiredCount += 1;
          }
          return;
        }
        const paidAt = (() => {
          if (!isPaid) return null;
          const raw3 = paymentLink?.transactionDateTime;
          if (typeof raw3 === "string" && raw3.trim()) {
            const parsed = new Date(raw3);
            if (!Number.isNaN(parsed.getTime())) return parsed;
          }
          return /* @__PURE__ */ new Date();
        })();
        const updated = await paymentRepository.updateFromWebhookIfPending({
          orderCode,
          status: isPaid ? "PAID" : isExpired ? "EXPIRED" : "FAILED",
          paymentLinkId: paymentLink.id ?? null,
          gatewayReference: paymentLink?.reference ?? null,
          gatewayCode: isPaid ? "00" : paymentLink.status,
          bankCode: paymentLink?.counterAccountBankId ?? null,
          paidAt,
          rawPayload: {
            source: "cron-reconcile",
            paymentLink
          }
        });
        if (updated) {
          updatedCount += 1;
          if (isPaid) {
            const payment = await paymentRepository.findByOrderCode(orderCode);
            if (payment && payment.status === "PAID") {
              try {
                await paymentSuccessNotifier.notify({
                  orderId: payment.orderId,
                  orderCode: payment.orderCode,
                  amount: payment.amount,
                  paidAt: payment.paidAt ?? /* @__PURE__ */ new Date()
                });
              } catch (notifyError) {
                logger9.warn("Failed to notify admin from reconcile worker", {
                  orderCode,
                  error: notifyError instanceof Error ? notifyError.message : String(notifyError)
                });
              }
            }
          }
        }
      } catch (err) {
        logger9.warn("Reconcile failed for orderCode", {
          orderCode,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    });
    logger9.info("Reconcile tick done", {
      checkedCount,
      updatedCount,
      localExpiredCount,
      batchSize: config2.batchSize,
      concurrency: config2.concurrency,
      pendingExpireMinutes: config2.pendingExpireMinutes,
      tookMs: Date.now() - startedAt
    });
  } finally {
    await releaseLock(config2.lockKey, lockValue);
  }
}
async function main() {
  const env = process.env.NODE_ENV || "development";
  dotenv2.config({ path: `.env.${env}` });
  const config2 = getConfig();
  logger9.info("Worker starting", { env, config: config2 });
  try {
    await redis.ping();
  } catch (err) {
    logger9.warn("Redis ping failed (will retry on next tick)", {
      error: err instanceof Error ? err.message : String(err)
    });
  }
  let running = false;
  const tick = async () => {
    if (running) {
      logger9.info("Skip tick: previous run still in progress");
      return;
    }
    running = true;
    try {
      await reconcileOnce(config2);
    } catch (err) {
      logger9.error("Reconcile tick crashed", {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      running = false;
    }
  };
  await tick();
  const timer = setInterval(() => {
    void tick();
  }, config2.intervalMs);
  const shutdown = async (signal) => {
    logger9.info("Worker shutting down", { signal });
    clearInterval(timer);
    try {
      await PrismaService.disconnect();
    } catch (err) {
      logger9.warn("Failed to disconnect prisma", {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    try {
      await redisService.disconnect();
    } catch (err) {
      logger9.warn("Failed to disconnect redis", {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}
void main();
