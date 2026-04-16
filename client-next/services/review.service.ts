import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type {
  CloudinarySignature,
  CreateReviewPayload,
  CreateReviewResult,
  OrderReviewStatus,
} from "@/types/review.types";

export const reviewService = {
  async getUploadSignature(
    params: { orderId?: string } = {},
  ): Promise<CloudinarySignature> {
    const response = await apiClient.post<CloudinarySignature>(
      "api/reviews/cloudinary/sign",
      {
        orderId: params.orderId,
      },
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CloudinarySignature>).data;
    }

    throw response as ApiErrorResponse;
  },

  async uploadImageToCloudinary(
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
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const result = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
    };

    if (!result.secure_url || !result.public_id) {
      throw new Error("Cloudinary response missing secure_url/public_id");
    }

    return { url: result.secure_url, publicId: result.public_id };
  },

  async createReview(
    payload: CreateReviewPayload,
  ): Promise<CreateReviewResult> {
    const response = await apiClient.post<CreateReviewResult>(
      "api/reviews",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CreateReviewResult>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getOrderReviewStatus(orderId: string): Promise<OrderReviewStatus> {
    const response = await apiClient.get<OrderReviewStatus>(
      `api/reviews/orders/${encodeURIComponent(orderId)}/status`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<OrderReviewStatus>).data;
    }

    throw response as ApiErrorResponse;
  },
};
