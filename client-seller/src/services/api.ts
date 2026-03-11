import { apiClient } from "@/lib/api";
import type {
  CategoryResponse,
  TagResponse,
  CreateProductCommand,
  CreateProductResult,
  CloudinarySignature,
  CloudinarySignatureResponse,
  ProductListResponse,
  ProductDetailResponse,
  ProductListFilters,
  UpdateProductCommand,
  BulkDeleteRequest,
  BulkAssignCategoriesRequest,
  BulkAssignTagsRequest,
  AdjustStockRequest,
  InventoryLogsResponse,
} from "@/types/api";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};

export const categoryService = {
  getCategories: async (): Promise<CategoryResponse> => {
    const response = await apiClient.get("/common/categories");
    return response.data;
  },
};

export const tagService = {
  getTags: async (): Promise<TagResponse> => {
    const response = await apiClient.get("/common/tags");
    return response.data;
  },
};

export const productService = {
  getProducts: async (
    filters: ProductListFilters,
  ): Promise<ProductListResponse> => {
    const response = await apiClient.get("/admin/products", {
      params: filters,
    });
    return response.data;
  },

  getProduct: async (id: string): Promise<ProductDetailResponse> => {
    const response = await apiClient.get(`/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (
    data: CreateProductCommand,
  ): Promise<CreateProductResult> => {
    const response = await apiClient.post("/admin/products", data);
    return response.data;
  },

  updateProduct: async (
    id: string,
    data: UpdateProductCommand,
  ): Promise<ProductDetailResponse> => {
    const response = await apiClient.put(`/admin/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  restoreProduct: async (id: string): Promise<ProductDetailResponse> => {
    const response = await apiClient.post(`/admin/products/${id}/restore`);
    return response.data;
  },

  bulkDelete: async (data: BulkDeleteRequest): Promise<void> => {
    await apiClient.post("/admin/products/bulk-delete", data);
  },

  bulkAssignCategories: async (
    data: BulkAssignCategoriesRequest,
  ): Promise<void> => {
    await apiClient.post("/admin/products/bulk-assign-categories", data);
  },

  bulkAssignTags: async (data: BulkAssignTagsRequest): Promise<void> => {
    await apiClient.post("/admin/products/bulk-assign-tags", data);
  },

  exportProducts: async (filters: ProductListFilters): Promise<Blob> => {
    const response = await apiClient.get("/admin/products/export", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  adjustStock: async (
    variantId: string,
    data: AdjustStockRequest,
  ): Promise<void> => {
    await apiClient.post(`/admin/variants/${variantId}/adjust-stock`, data);
  },

  getInventoryLogs: async (params: {
    page?: number;
    limit?: number;
    variantId?: string;
    productId?: string;
  }): Promise<InventoryLogsResponse> => {
    const response = await apiClient.get("/admin/inventory/logs", { params });
    return response.data;
  },
};

export const cloudinaryService = {
  getSignature: async (): Promise<CloudinarySignatureResponse> => {
    const response = await apiClient.post("/admin/cloudinary/sign", {
      productId: "products",
    });
    return response.data;
  },

  uploadImage: async (
    file: File,
    signature: CloudinarySignature,
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", signature.timestamp.toString());
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const result = await response.json();
    return result.secure_url;
  },
};
