import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';

// Use Cases
import {
  CreateProductUseCase,
  GetProductsListUseCase,
  GetProductDetailUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  RestoreProductUseCase,
  BulkDeleteProductsUseCase,
  CreateVariantUseCase,
  UpdateVariantUseCase,
  DeleteVariantUseCase,
  AdjustStockUseCase,
  BulkAssignCategoriesUseCase,
  BulkAssignTagsUseCase,
  GetCategoriesUseCase,
  GetTagsUseCase,
  GetInventoryLogsUseCase,
  GenerateSignatureUseCase,
  SaveProductImageUseCase,
  DeleteProductImageUseCase,
  ExportProductsUseCase,
} from './applications/usecases';

// Repositories
import {
  PrismaProductRepository,
  PrismaProductImageRepository,
  PrismaVariantRepository,
  PrismaInventoryRepository,
  PrismaCategoryRepository,
  PrismaTagRepository,
  PrismaPriceHistoryRepository,
  CloudinaryServiceImpl,
} from './infrastructure/repositories';

// Controllers
import {
  ProductController,
  VariantController,
  BulkOperationsController,
  CategoryTagController,
  InventoryController,
  UploadController,
} from './interface-adapter/controller';

// APIs
import {
  ProductAPI,
  VariantAPI,
  BulkOperationsAPI,
  CategoryTagAPI,
  InventoryAPI,
  UploadAPI,
} from './infrastructure/api';

export function createAdminModule(): Router {
  const router = Router();

  // Initialize Repositories
  const productRepository = new PrismaProductRepository(prisma);
  const productImageRepository = new PrismaProductImageRepository(prisma);
  const variantRepository = new PrismaVariantRepository(prisma);
  const inventoryRepository = new PrismaInventoryRepository(prisma);
  const categoryRepository = new PrismaCategoryRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const priceHistoryRepository = new PrismaPriceHistoryRepository(prisma);
  const cloudinaryService = new CloudinaryServiceImpl();

  // Initialize Use Cases
  const createProductUseCase = new CreateProductUseCase(productRepository);
  const getProductsListUseCase = new GetProductsListUseCase(productRepository);
  const getProductDetailUseCase = new GetProductDetailUseCase(productRepository);
  const updateProductUseCase = new UpdateProductUseCase(
    productRepository,
    variantRepository,
    priceHistoryRepository,
  );
  const deleteProductUseCase = new DeleteProductUseCase(productRepository);
  const restoreProductUseCase = new RestoreProductUseCase(productRepository);
  const bulkDeleteProductsUseCase = new BulkDeleteProductsUseCase(productRepository);
  const exportProductsUseCase = new ExportProductsUseCase(productRepository);

  const createVariantUseCase = new CreateVariantUseCase(variantRepository, productRepository);
  const updateVariantUseCase = new UpdateVariantUseCase(variantRepository, priceHistoryRepository);
  const deleteVariantUseCase = new DeleteVariantUseCase(variantRepository);
  const adjustStockUseCase = new AdjustStockUseCase(variantRepository);

  const bulkAssignCategoriesUseCase = new BulkAssignCategoriesUseCase(
    productRepository,
    categoryRepository,
  );
  const bulkAssignTagsUseCase = new BulkAssignTagsUseCase(productRepository, tagRepository);

  const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
  const getTagsUseCase = new GetTagsUseCase(tagRepository);

  const getInventoryLogsUseCase = new GetInventoryLogsUseCase(inventoryRepository);

  const generateSignatureUseCase = new GenerateSignatureUseCase(cloudinaryService);
  const saveProductImageUseCase = new SaveProductImageUseCase(
    productImageRepository,
    productRepository,
  );
  const deleteProductImageUseCase = new DeleteProductImageUseCase(
    productImageRepository,
    cloudinaryService,
  );

  // Initialize Controllers
  const productController = new ProductController(
    createProductUseCase,
    getProductsListUseCase,
    getProductDetailUseCase,
    updateProductUseCase,
    deleteProductUseCase,
    restoreProductUseCase,
    bulkDeleteProductsUseCase,
    exportProductsUseCase,
  );

  const variantController = new VariantController(
    createVariantUseCase,
    updateVariantUseCase,
    deleteVariantUseCase,
    adjustStockUseCase,
  );

  const bulkOperationsController = new BulkOperationsController(
    bulkAssignCategoriesUseCase,
    bulkAssignTagsUseCase,
  );

  const categoryTagController = new CategoryTagController(getCategoriesUseCase, getTagsUseCase);

  const inventoryController = new InventoryController(getInventoryLogsUseCase);

  const uploadController = new UploadController(
    generateSignatureUseCase,
    saveProductImageUseCase,
    deleteProductImageUseCase,
  );

  // Initialize APIs
  const productAPI = new ProductAPI(productController);
  const variantAPI = new VariantAPI(variantController);
  const bulkOperationsAPI = new BulkOperationsAPI(bulkOperationsController);
  const categoryTagAPI = new CategoryTagAPI(categoryTagController);
  const inventoryAPI = new InventoryAPI(inventoryController);
  const uploadAPI = new UploadAPI(uploadController);

  // Register routes
  router.use(productAPI.router);
  router.use(variantAPI.router);
  router.use(bulkOperationsAPI.router);
  router.use(categoryTagAPI.router);
  router.use(inventoryAPI.router);
  router.use(uploadAPI.router);

  return router;
}

export const AdminConnect = createAdminModule;
