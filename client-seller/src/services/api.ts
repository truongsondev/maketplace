import { apiClient } from "@/lib/api";
import type {
  CategoryResponse,
  TagResponse,
  CreateProductCommand,
  CreateProductResult,
  CloudinarySignature,
  CloudinarySignatureResponse,
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
  createProduct: async (
    data: CreateProductCommand,
  ): Promise<CreateProductResult> => {
    const response = await apiClient.post("/admin/products", data);
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
