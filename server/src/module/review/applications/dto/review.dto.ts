export type GenerateReviewUploadSignatureCommand = {
  userId: string;
  orderId?: string;
};

export type GenerateReviewUploadSignatureResult = {
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

export type CreateReviewCommand = {
  userId: string;
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

export type GetOrderReviewStatusQuery = {
  userId: string;
  orderId: string;
};

export type GetOrderReviewStatusResult = {
  orderId: string;
  items: Array<{
    orderItemId: string;
    reviewed: boolean;
    reviewId: string | null;
  }>;
};
