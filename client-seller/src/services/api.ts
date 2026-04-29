import { apiClient } from "@/lib/api";
import type {
  CategoryResponse,
  TagResponse,
  ProductTypeSchemaResponse,
  CreateProductCommand,
  CreateProductResult,
  CloudinarySignature,
  CloudinarySignatureResponse,
  ProductListResponse,
  ProductDetailResponse,
  UpdateProductResponse,
  ProductListFilters,
  UpdateProductCommand,
  BulkDeleteRequest,
  BulkAssignCategoriesRequest,
  BulkAssignTagsRequest,
  AdjustStockRequest,
  InventoryLogsResponse,
  AdminLogsResponse,
  VoucherListResponse,
  VoucherResponse,
  VoucherUpsertCommand,
  BannerListResponse,
  BannerResponse,
  BannerUpsertCommand,
} from "@/types/api";
import type {
  AdminProductLeastBoughtResponse,
  AdminProductTopFavoritedResponse,
  AdminProductTopSellingResponse,
} from "@/types/product-analytics";
import type { LoginRequest, LoginResponse } from "@/types/auth";
import type {
  AdminOrderConfirmCheckResponse,
  AdminOrdersCountsResponse,
  AdminOrdersListResponse,
  AdminOrderTab,
  AdminOrderSort,
  AdminOrderStatusBreakdownResponse,
  AdminOrderTimeseriesResponse,
} from "@/types/order";
import type {
  AdminUserAuditsResponse,
  AdminUserDetailResponse,
  AdminUserMutationResponse,
  AdminUserRole,
  AdminUsersResponse,
  AdminUserStatus,
  AdminUserCustomerCohortsResponse,
  AdminUserTopSpendersResponse,
} from "@/types/user";
import type {
  AdminRefundDetailResponse,
  AdminRefundListResponse,
  AdminRefundStatus,
  AdminRefundType,
} from "@/types/refund";
import type {
  DashboardOverview,
  DashboardRecentOrder,
  DashboardTimeseries,
} from "../types/dashboard";
import type { AdminNotificationListResult } from "@/types/notification";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/admin/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/refresh-token", {
      refreshToken,
    });
    return response.data;
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

export const productTypeSchemaService = {
  getSchema: async (categoryId: string): Promise<ProductTypeSchemaResponse> => {
    const response = await apiClient.get("/common/product-type-schema", {
      params: { categoryId },
    });
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
  ): Promise<UpdateProductResponse> => {
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

  getTopSelling: async (params?: {
    days?: number;
    limit?: number;
  }): Promise<AdminProductTopSellingResponse> => {
    const response = await apiClient.get(
      "/admin/products/analytics/top-selling",
      {
        params,
      },
    );
    return response.data;
  },

  getTopFavorited: async (params?: {
    days?: number;
    limit?: number;
  }): Promise<AdminProductTopFavoritedResponse> => {
    const response = await apiClient.get(
      "/admin/products/analytics/top-favorited",
      { params },
    );
    return response.data;
  },

  getLeastBought: async (params?: {
    days?: number;
    limit?: number;
  }): Promise<AdminProductLeastBoughtResponse> => {
    const response = await apiClient.get(
      "/admin/products/analytics/least-bought",
      {
        params,
      },
    );
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
  getSignature: async (
    folderKey = "products",
  ): Promise<CloudinarySignatureResponse> => {
    const response = await apiClient.post("/admin/cloudinary/sign", {
      productId: folderKey,
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

export const orderService = {
  getOrders: async (params: {
    tab?: AdminOrderTab;
    search?: string;
    sort?: AdminOrderSort;
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<AdminOrdersListResponse> => {
    const response = await apiClient.get("/admin/orders", { params });
    return response.data;
  },

  exportOrders: async (params: {
    tab?: AdminOrderTab;
    search?: string;
    sort?: AdminOrderSort;
    from?: string;
    to?: string;
  }): Promise<Blob> => {
    const response = await apiClient.get("/admin/orders/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  getCounts: async (params?: {
    from?: string;
    to?: string;
  }): Promise<AdminOrdersCountsResponse> => {
    const response = await apiClient.get("/admin/orders/counts", { params });
    return response.data;
  },

  getAnalyticsStatus: async (params?: {
    days?: number;
    from?: string;
    to?: string;
  }): Promise<AdminOrderStatusBreakdownResponse> => {
    const response = await apiClient.get("/admin/orders/analytics/status", {
      params,
    });
    return response.data;
  },

  getAnalyticsTimeseries: async (params?: {
    days?: number;
    from?: string;
    to?: string;
  }): Promise<AdminOrderTimeseriesResponse> => {
    const response = await apiClient.get("/admin/orders/analytics/timeseries", {
      params,
    });
    return response.data;
  },

  cancelOrder: async (orderId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/cancel`, {
      reason,
    });
  },

  approveCancelRequest: async (orderId: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/cancel-requests/approve`);
  },

  rejectCancelRequest: async (
    orderId: string,
    rejectionReason: string,
  ): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/cancel-requests/reject`, {
      rejectionReason,
    });
  },

  completeCancelManualRefund: async (orderId: string): Promise<void> => {
    await apiClient.post(
      `/admin/orders/${orderId}/cancel-requests/complete-refund`,
    );
  },

  checkConfirmOrder: async (
    orderId: string,
  ): Promise<AdminOrderConfirmCheckResponse> => {
    const response = await apiClient.get(
      `/admin/orders/${orderId}/confirm/check`,
    );
    return response.data;
  },

  confirmOrder: async (orderId: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/confirm`);
  },

  shipOrder: async (orderId: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/ship`);
  },

  deliverOrder: async (orderId: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/deliver`);
  },

  approveReturns: async (orderId: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/returns/approve`);
  },

  rejectReturns: async (orderId: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/returns/reject`);
  },

  completeReturns: async (orderId: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${orderId}/returns/complete`);
  },
};

export const voucherService = {
  getVouchers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<VoucherListResponse> => {
    const response = await apiClient.get("/admin/vouchers", { params });
    return response.data;
  },

  createVoucher: async (
    data: VoucherUpsertCommand,
  ): Promise<VoucherResponse> => {
    const response = await apiClient.post("/admin/vouchers", data);
    return response.data;
  },

  updateVoucher: async (
    id: string,
    data: VoucherUpsertCommand,
  ): Promise<VoucherResponse> => {
    const response = await apiClient.put(`/admin/vouchers/${id}`, data);
    return response.data;
  },

  updateStatus: async (
    id: string,
    isActive: boolean,
  ): Promise<VoucherResponse> => {
    const response = await apiClient.patch(`/admin/vouchers/${id}/status`, {
      isActive,
    });
    return response.data;
  },
};

export const bannerService = {
  getBanners: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<BannerListResponse> => {
    const response = await apiClient.get("/admin/banners", { params });
    return response.data;
  },

  createBanner: async (data: BannerUpsertCommand): Promise<BannerResponse> => {
    const response = await apiClient.post("/admin/banners", data);
    return response.data;
  },

  updateBanner: async (
    id: string,
    data: BannerUpsertCommand,
  ): Promise<BannerResponse> => {
    const response = await apiClient.put(`/admin/banners/${id}`, data);
    return response.data;
  },

  updateStatus: async (
    id: string,
    isActive: boolean,
  ): Promise<BannerResponse> => {
    const response = await apiClient.patch(`/admin/banners/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  getUploadSignature: async (
    folder = "banners",
  ): Promise<CloudinarySignatureResponse> => {
    const response = await apiClient.post("/admin/banners/cloudinary/sign", {
      folder,
    });
    return response.data;
  },
};

export const userService = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminUserStatus;
    role?: AdminUserRole;
    emailVerified?: boolean;
    sortBy?: "createdAt" | "lastLogin" | "email";
    sortOrder?: "asc" | "desc";
  }): Promise<AdminUsersResponse> => {
    const response = await apiClient.get("/admin/users", { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<AdminUserDetailResponse> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    payload: { status: AdminUserStatus; reason: string },
  ): Promise<AdminUserMutationResponse> => {
    const response = await apiClient.patch(
      `/admin/users/${id}/status`,
      payload,
    );
    return response.data;
  },

  updateRole: async (
    id: string,
    payload: { role: AdminUserRole; reason: string },
  ): Promise<AdminUserMutationResponse> => {
    const response = await apiClient.patch(`/admin/users/${id}/role`, payload);
    return response.data;
  },

  getAudits: async (
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<AdminUserAuditsResponse> => {
    const response = await apiClient.get(`/admin/users/${id}/audits`, {
      params,
    });
    return response.data;
  },

  getCustomerCohorts: async (params?: {
    days?: number;
  }): Promise<AdminUserCustomerCohortsResponse> => {
    const response = await apiClient.get(
      "/admin/users/analytics/customer-cohorts",
      { params },
    );
    return response.data;
  },

  getTopSpenders: async (params?: {
    days?: number;
    limit?: number;
  }): Promise<AdminUserTopSpendersResponse> => {
    const response = await apiClient.get(
      "/admin/users/analytics/top-spenders",
      {
        params,
      },
    );
    return response.data;
  },

  exportUsers: async (params?: {
    search?: string;
    status?: AdminUserStatus;
    role?: AdminUserRole;
    emailVerified?: boolean;
    sortBy?: "createdAt" | "lastLogin" | "email";
    sortOrder?: "asc" | "desc";
  }): Promise<Blob> => {
    const response = await apiClient.get("/admin/users/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

export const refundService = {
  getRefunds: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminRefundStatus;
    type?: AdminRefundType;
    sortBy?: "requestedAt" | "processedAt" | "amount";
    sortOrder?: "asc" | "desc";
    from?: string;
    to?: string;
  }): Promise<AdminRefundListResponse> => {
    const response = await apiClient.get("/admin/refunds", { params });
    return response.data;
  },

  getRefundById: async (id: string): Promise<AdminRefundDetailResponse> => {
    const response = await apiClient.get(`/admin/refunds/${id}`);
    return response.data;
  },

  retryRefund: async (id: string): Promise<AdminRefundDetailResponse> => {
    const response = await apiClient.post(`/admin/refunds/${id}/retry`);
    return response.data;
  },
};

export const dashboardService = {
  getOverview: async (params?: {
    days?: number;
    from?: string;
    to?: string;
  }): Promise<DashboardOverview> => {
    const response = await apiClient.get("/admin/dashboard/overview", {
      params,
    });
    return response.data.data;
  },
  getTimeseries: async (params?: {
    days?: number;
    from?: string;
    to?: string;
  }): Promise<DashboardTimeseries> => {
    const response = await apiClient.get("/admin/dashboard/timeseries", {
      params,
    });
    return response.data.data;
  },
  getRecentOrders: async (params?: {
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<DashboardRecentOrder[]> => {
    const response = await apiClient.get("/admin/dashboard/recent-orders", {
      params,
    });
    return response.data.data.items;
  },
};

export const logsService = {
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    actorType?: "ADMIN" | "USER" | "SYSTEM";
    actorId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    from?: string;
    to?: string;
  }): Promise<AdminLogsResponse> => {
    const response = await apiClient.get("/admin/logs", { params });
    return response.data;
  },
};

export const adminNotificationService = {
  list: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<AdminNotificationListResult> => {
    const response = await apiClient.get("/admin/notifications", { params });
    return response.data.data;
  },

  markAsRead: async (id: string): Promise<{ updated: boolean }> => {
    const response = await apiClient.patch(`/admin/notifications/${id}/read`);
    return response.data.data;
  },

  markAllAsRead: async (): Promise<{ updatedCount: number }> => {
    const response = await apiClient.patch("/admin/notifications/read-all");
    return response.data.data;
  },
};
