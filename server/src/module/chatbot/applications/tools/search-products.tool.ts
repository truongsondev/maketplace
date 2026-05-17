import {
  ChatbotCatalogProduct,
  ChatbotCatalogSearchInput,
  IChatbotProductCatalog,
} from '../ports/output/chatbot-product-catalog';

export interface SearchProductsToolInput {
  search?: string;
  category?: string;
  color?: string;
  size?: string;
  usageOccasion?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface SearchProductsToolResult {
  items: ChatbotCatalogProduct[];
  total: number;
}

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 4;

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value);
}

function normalizeLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(value), 1), MAX_LIMIT);
}

export class SearchProductsTool {
  readonly name = 'searchProducts';

  constructor(private readonly productCatalog: IChatbotProductCatalog) {}

  async execute(input: SearchProductsToolInput): Promise<SearchProductsToolResult> {
    const minPrice = normalizeNumber(input.minPrice);
    const maxPrice = normalizeNumber(input.maxPrice);

    const searchInput: ChatbotCatalogSearchInput = {
      search: normalizeText(input.search),
      category: normalizeText(input.category),
      color: normalizeText(input.color),
      size: normalizeText(input.size)?.toUpperCase(),
      usageOccasion: normalizeText(input.usageOccasion),
      minPrice,
      maxPrice,
      limit: normalizeLimit(input.limit),
    };

    if (
      searchInput.minPrice !== undefined &&
      searchInput.maxPrice !== undefined &&
      searchInput.minPrice > searchInput.maxPrice
    ) {
      const originalMin = searchInput.minPrice;
      searchInput.minPrice = searchInput.maxPrice;
      searchInput.maxPrice = originalMin;
    }

    const items = await this.productCatalog.searchProducts(searchInput);
    return {
      items,
      total: items.length,
    };
  }
}
