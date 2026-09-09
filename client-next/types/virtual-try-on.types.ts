export type VirtualTryOnCategory = "upper_body" | "lower_body" | "dresses";
export type VirtualTryOnStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "TIMEOUT";

export interface VirtualTryOnRequest {
  id: string;
  productId: string;
  productImageUrl: string;
  humanImageUrl: string;
  outputImageUrl: string | null;
  status: VirtualTryOnStatus;
  category: VirtualTryOnCategory;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateVirtualTryOnPayload {
  productId: string;
  productImageUrl: string;
  humanImageUrl: string;
  category: VirtualTryOnCategory;
  crop: boolean;
  steps: number;
  seed?: number;
}

export interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}
