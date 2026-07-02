import { apiClient } from "@/lib/api-client";
import type {
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiSuccessResponse,
} from "@/types/api.types";
import type {
  CloudinarySignature,
  CreateVirtualTryOnPayload,
  VirtualTryOnRequest,
} from "@/types/virtual-try-on.types";

export const virtualTryOnService = {
  async getUploadSignature(): Promise<CloudinarySignature> {
    const response = await apiClient.post<CloudinarySignature>(
      "api/virtual-try-on/cloudinary/sign",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CloudinarySignature>).data;
    }

    throw response as ApiErrorResponse;
  },

  async uploadHumanImage(
    file: File,
    signature: CloudinarySignature,
  ): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", signature.timestamp.toString());
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      { method: "POST", body: formData },
    );

    if (!response.ok) {
      throw new Error("Không tải được ảnh cá nhân.");
    }

    const result = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
    };

    if (!result.secure_url || !result.public_id) {
      throw new Error("Cloudinary không trả về ảnh hợp lệ.");
    }

    return { url: result.secure_url, publicId: result.public_id };
  },

  async create(
    payload: CreateVirtualTryOnPayload,
  ): Promise<VirtualTryOnRequest> {
    const response = await apiClient.post<VirtualTryOnRequest>(
      "api/virtual-try-on",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<VirtualTryOnRequest>).data;
    }

    throw response as ApiErrorResponse;
  },

  async get(id: string): Promise<VirtualTryOnRequest> {
    const response = await apiClient.get<VirtualTryOnRequest>(
      `api/virtual-try-on/${encodeURIComponent(id)}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<VirtualTryOnRequest>).data;
    }

    throw response as ApiErrorResponse;
  },

  async listHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiPaginatedResponse<VirtualTryOnRequest>> {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 12));

    const response = await apiClient.get<VirtualTryOnRequest[]>(
      `api/virtual-try-on/history?${searchParams.toString()}`,
    );

    if (response.success && "pagination" in response) {
      return response as ApiPaginatedResponse<VirtualTryOnRequest>;
    }

    throw response as ApiErrorResponse;
  },
};
