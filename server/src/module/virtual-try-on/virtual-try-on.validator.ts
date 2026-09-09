import { BadRequestError } from '../../error-handlling/badRequestError';
import type { VirtualTryOnCategory } from './virtual-try-on.types';

const CATEGORIES = new Set(['upper_body', 'lower_body', 'dresses']);

function cleanUrl(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestError(`${field} là bắt buộc.`, 'INVALID_IMAGE_URL');
  }

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('invalid protocol');
    }
    return url.toString();
  } catch {
    throw new BadRequestError(`${field} không phải URL hợp lệ.`, 'INVALID_IMAGE_URL');
  }
}

export function parseCreateVirtualTryOnBody(body: any): {
  productId: string;
  productImageUrl?: string;
  humanImageUrl: string;
  category: VirtualTryOnCategory;
  crop: boolean;
  steps: number;
  seed?: number;
} {
  const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';
  if (!productId) {
    throw new BadRequestError('productId là bắt buộc.', 'PRODUCT_NOT_FOUND');
  }

  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  if (!CATEGORIES.has(category)) {
    throw new BadRequestError('Loại trang phục không hợp lệ.', 'INVALID_CATEGORY');
  }

  const steps = body?.steps === undefined ? 30 : Number(body.steps);
  if (!Number.isInteger(steps) || steps < 1 || steps > 40) {
    throw new BadRequestError('steps phải là số nguyên từ 1 đến 40.', 'VALIDATION_ERROR');
  }

  let seed: number | undefined;
  if (body?.seed !== undefined && body.seed !== null && body.seed !== '') {
    seed = Number(body.seed);
    if (!Number.isInteger(seed)) {
      throw new BadRequestError('seed phải là số nguyên.', 'VALIDATION_ERROR');
    }
  }

  return {
    productId,
    productImageUrl:
      typeof body?.productImageUrl === 'string' && body.productImageUrl.trim()
        ? cleanUrl(body.productImageUrl, 'Ảnh sản phẩm')
        : undefined,
    humanImageUrl: cleanUrl(body?.humanImageUrl, 'Ảnh cá nhân'),
    category: category as VirtualTryOnCategory,
    crop: Boolean(body?.crop),
    steps,
    seed,
  };
}
