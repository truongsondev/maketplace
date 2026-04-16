export type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export type ReviewImageInput = {
  url: string;
  publicId?: string | null;
};

export type CreateReviewPayload = {
  orderItemId: string;
  rating: number;
  comment?: string | null;
  images?: ReviewImageInput[];
};

export type CreateReviewResult = {
  reviewId: string;
  message: string;
  alreadyExists: boolean;
};

export type OrderReviewStatus = {
  orderId: string;
  items: Array<{
    orderItemId: string;
    reviewed: boolean;
    reviewId: string | null;
  }>;
};
