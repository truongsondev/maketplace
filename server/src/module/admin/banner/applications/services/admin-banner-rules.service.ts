import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type { AdminBannerInput, NormalizedAdminBannerInput } from '../dto/admin-banner.dto';

export class AdminBannerRulesService {
  static normalizeInput(input: AdminBannerInput): NormalizedAdminBannerInput {
    const title = String(input.title || '').trim();
    if (!title) {
      throw new BadRequestError('title is required');
    }

    const imageUrl = String(input.imageUrl || '').trim();
    if (!imageUrl) {
      throw new BadRequestError('imageUrl is required');
    }

    const subtitle = this.normalizeOptionalText(input.subtitle, 255);
    const description = this.normalizeOptionalText(input.description, 500);

    const sortOrderRaw = input.sortOrder ?? 0;
    if (!Number.isInteger(sortOrderRaw)) {
      throw new BadRequestError('sortOrder must be an integer');
    }

    return {
      title,
      subtitle,
      description,
      imageUrl,
      isActive: input.isActive ?? false,
      sortOrder: sortOrderRaw,
    };
  }

  private static normalizeOptionalText(
    value: string | null | undefined,
    maxLength: number,
  ): string | null {
    if (value === undefined || value === null) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length > maxLength) {
      throw new BadRequestError(`Text length must not exceed ${maxLength} characters`);
    }

    return trimmed;
  }
}
