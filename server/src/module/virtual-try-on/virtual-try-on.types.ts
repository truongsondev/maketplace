export type VirtualTryOnCategory = 'upper_body' | 'lower_body' | 'dresses';
export type VirtualTryOnStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED'
  | 'TIMEOUT';

export interface CreateVirtualTryOnInput {
  userId: string;
  productId: string;
  productImageUrl?: string;
  humanImageUrl: string;
  category: VirtualTryOnCategory;
  crop?: boolean;
  steps?: number;
  seed?: number;
}

export interface AiPredictionCreateResult {
  predictionId: string;
  status: string;
  output: string | null;
  error: string | null;
}

export interface AiPredictionStatusResult extends AiPredictionCreateResult {}

export function normalizeProviderStatus(status: string): VirtualTryOnStatus {
  const normalized = status.toLowerCase();
  if (['starting', 'processing'].includes(normalized)) return 'PROCESSING';
  if (normalized === 'succeeded') return 'SUCCEEDED';
  if (normalized === 'canceled') return 'CANCELED';
  if (normalized === 'timeout') return 'TIMEOUT';
  if (['failed', 'error'].includes(normalized)) return 'FAILED';
  return 'PROCESSING';
}
