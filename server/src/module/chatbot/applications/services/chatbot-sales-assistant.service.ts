import { ChatSessionRecord, ChatSessionStatus } from '../ports/output/chat-session.repository';
import {
  ChatbotCatalogProduct,
  IChatbotProductCatalog,
} from '../ports/output/chatbot-product-catalog';
import {
  buildSimpleChatbotReply,
  detectSimpleChatbotIntent,
  hasFashionShoppingIntent,
} from './chatbot-conversation-intent';

type ShopperProfile = {
  budgetMin?: number;
  budgetMax?: number;
  color?: string;
  size?: string;
  usageOccasion?: string;
  categoryHint?: string;
};

export interface AssistantReply {
  content: string;
  status: ChatSessionStatus;
  shopperProfile: Record<string, unknown>;
  leadPhone: string | null;
  leadEmail: string | null;
  lastIntent: string | null;
  lastSummary: string | null;
  suggestedProducts: ChatbotCatalogProduct[];
  quickReplies: Array<{ label: string; value: string }>;
}

const OCCASION_KEYWORDS: Array<{ value: string; keywords: string[] }> = [
  { value: 'di_lam', keywords: ['cong so', 'di lam', 'van phong', 'office'] },
  { value: 'tap_the_thao', keywords: ['the thao', 'tap gym', 'chay bo', 'workout'] },
  { value: 'di_choi', keywords: ['di choi', 'hen ho', 'cuoi tuan', 'dạo phố'] },
  { value: 'du_tiec', keywords: ['du tiec', 'su kien', 'party'] },
  { value: 'hang_ngay', keywords: ['hang ngay', 'mac thuong ngay', 'basic'] },
];

const CATEGORY_KEYWORDS: Array<{ value: string; keywords: string[] }> = [
  { value: 'ao', keywords: ['ao', 'ao thun', 'shirt', 'tee'] },
  { value: 'quan', keywords: ['quan', 'jean', 'trouser'] },
  { value: 'vay', keywords: ['dam', 'dress'] },
  { value: 'hoodie', keywords: ['hoodie', 'sweater'] },
  { value: 'ao-khoac', keywords: ['ao khoac', 'jacket', 'blazer'] },
];

const COLOR_KEYWORDS = ['den', 'trang', 'xam', 'be', 'nau', 'xanh', 'do', 'hong'];
const APPAREL_CATEGORY_HINTS = [
  'ao',
  'quan',
  'vay',
  'dam',
  'chan-vay',
  'hoodie',
  'ao-khoac',
  'blazer',
  'thoi-trang',
];
const ACCESSORY_CATEGORY_HINTS = [
  'balo',
  'tui',
  'tui-xach',
  'phu-kien',
  'that-lung',
  'non',
  'mu',
  'giay',
  'dep',
  'vi',
];
const APPAREL_NAME_KEYWORDS = [
  'ao',
  'shirt',
  'tee',
  'quan',
  'vay',
  'dam',
  'hoodie',
  'blazer',
  'jacket',
  'jean',
  'so mi',
];
const ACCESSORY_NAME_KEYWORDS = [
  'balo',
  'tui',
  'vi',
  'that lung',
  'non',
  'mu',
  'giay',
  'dep',
  'sandal',
];
const QUICK_REPLIES = [
  { label: 'Đồ đi làm', value: 'Mình cần outfit đi làm' },
  { label: 'Đồ đi chơi', value: 'Gợi ý outfit đi chơi cuối tuần' },
  { label: 'Ngân sách 500k', value: 'Ngân sách của mình khoảng 500k' },
  { label: 'Để lại SĐT', value: 'Số điện thoại của mình là 0901234567' },
];

const USAGE_OCCASION_LABELS: Record<string, string> = {
  di_lam: 'đi làm',
  di_choi: 'đi chơi',
  tap_the_thao: 'tập thể thao',
  du_tiec: 'dự tiệc',
  hang_ngay: 'hằng ngày',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTextKeepingAccents(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEmail(content: string): string | null {
  const match = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function extractPhone(content: string): string | null {
  const match = content.match(/(?:\+?84|0)(?:\d[\s.-]?){8,10}/);
  if (!match) return null;

  const digits = match[0].replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 11) return null;
  return digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
}

function extractBudget(content: string): { min?: number; max?: number } {
  const normalized = normalizeText(content).replace(/,/g, '.');
  const rangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(tr|trieu|k)?\s*(?:-|den|toi)\s*(\d+(?:\.\d+)?)\s*(tr|trieu|k)?/,
  );
  if (rangeMatch) {
    const min = toCurrencyNumber(rangeMatch[1], rangeMatch[2]);
    const max = toCurrencyNumber(rangeMatch[3], rangeMatch[4]);
    if (min !== null && max !== null) {
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
  }

  const maxMatch = normalized.match(/(?:duoi|toi da|tam)\s*(\d+(?:\.\d+)?)\s*(tr|trieu|k)/);
  if (maxMatch) {
    const max = toCurrencyNumber(maxMatch[1], maxMatch[2]);
    if (max !== null) return { max };
  }

  const singleMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(tr|trieu|k|nghin|ngan|vnd)/);
  if (singleMatch) {
    const value = toCurrencyNumber(singleMatch[1], singleMatch[2]);
    if (value !== null) return { max: value };
  }

  return {};
}

function toCurrencyNumber(value: string, unit?: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  const normalizedUnit = normalizeText(unit ?? '');
  if (normalizedUnit === 'tr' || normalizedUnit === 'trieu') return parsed * 1_000_000;
  if (normalizedUnit === 'k' || normalizedUnit === 'nghin' || normalizedUnit === 'ngan') {
    return parsed * 1_000;
  }

  if (parsed < 1_000) return parsed * 1_000;
  return parsed;
}

function pickKeywordValue(
  content: string,
  dictionary: Array<{ value: string; keywords: string[] }>,
): string | undefined {
  const normalized = normalizeText(content);
  const haystack = ` ${normalized} `;
  return dictionary.find((entry) =>
    entry.keywords.some((keyword) => haystack.includes(` ${normalizeText(keyword)} `)),
  )?.value;
}

function pickCategoryHint(content: string): string | undefined {
  const accented = ` ${normalizeTextKeepingAccents(content)} `;
  if (accented.includes(' váy ')) return 'vay';

  return pickKeywordValue(content, CATEGORY_KEYWORDS);
}

function pickColor(content: string): string | undefined {
  const normalized = normalizeText(content);
  return COLOR_KEYWORDS.find((color) => normalized.includes(color));
}

function pickSize(content: string): string | undefined {
  const match = normalizeText(content).match(/\b(xs|s|m|l|xl|xxl)\b/);
  return match?.[1]?.toUpperCase();
}

function formatUsageOccasion(value: string): string {
  return USAGE_OCCASION_LABELS[value] ?? value.replace(/_/g, ' ');
}

function uniqueProducts(products: ChatbotCatalogProduct[]): ChatbotCatalogProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function hasAnyKeyword(value: string, keywords: string[]): boolean {
  const haystack = ` ${normalizeText(value).replace(/[_-]/g, ' ')} `;
  return keywords.some((keyword) => {
    const needle = ` ${normalizeText(keyword).replace(/[_-]/g, ' ')} `;
    return haystack.includes(needle);
  });
}

function categoryMatchesAnyHint(categorySlugs: string[], hints: string[]): boolean {
  return categorySlugs.some((slug) => hints.some((hint) => slug === hint || slug.includes(hint)));
}

function isLikelyApparel(product: ChatbotCatalogProduct): boolean {
  const normalizedName = normalizeText(product.name);
  const categorySlugs = product.categorySlugs ?? [];
  return (
    categoryMatchesAnyHint(categorySlugs, APPAREL_CATEGORY_HINTS) ||
    hasAnyKeyword(normalizedName, APPAREL_NAME_KEYWORDS)
  );
}

function isLikelyAccessory(product: ChatbotCatalogProduct): boolean {
  const normalizedName = normalizeText(product.name);
  const categorySlugs = product.categorySlugs ?? [];
  return (
    categoryMatchesAnyHint(categorySlugs, ACCESSORY_CATEGORY_HINTS) ||
    hasAnyKeyword(normalizedName, ACCESSORY_NAME_KEYWORDS)
  );
}

function scoreProductMatch(params: {
  product: ChatbotCatalogProduct;
  normalizedMessage: string;
  shopperProfile: ShopperProfile;
  categoryHint?: string;
}): number {
  const { product, normalizedMessage, shopperProfile, categoryHint } = params;
  const normalizedName = normalizeText(product.name);
  const categorySlugs = product.categorySlugs ?? [];
  const usageOccasions = product.usageOccasions ?? [];

  let score = 0;

  if (shopperProfile.usageOccasion && usageOccasions.includes(shopperProfile.usageOccasion)) {
    score += 6;
  }

  if (categoryHint) {
    if (categorySlugs.includes(categoryHint)) score += 5;
    if (normalizedName.includes(categoryHint.replace(/-/g, ' '))) score += 2;
  }

  if (isLikelyApparel(product)) score += 4;
  if (isLikelyAccessory(product)) score -= 5;

  if (hasAnyKeyword(normalizedMessage, ['outfit', 'phoi do', 'mac', 'set do'])) {
    if (isLikelyApparel(product)) score += 4;
    if (isLikelyAccessory(product)) score -= 7;
  }

  if (shopperProfile.budgetMax !== undefined && product.minPrice <= shopperProfile.budgetMax) {
    score += 2;
  }
  if (shopperProfile.budgetMin !== undefined && product.minPrice >= shopperProfile.budgetMin) {
    score += 1;
  }

  const messageTokens = normalizedMessage.split(' ').filter((token) => token.length >= 3);
  score += messageTokens.filter((token) => normalizedName.includes(token)).length * 0.5;

  return score;
}

function rerankProducts(params: {
  products: ChatbotCatalogProduct[];
  normalizedMessage: string;
  shopperProfile: ShopperProfile;
  categoryHint?: string;
}): ChatbotCatalogProduct[] {
  const scored = params.products.map((product) => ({
    product,
    score: scoreProductMatch({
      product,
      normalizedMessage: params.normalizedMessage,
      shopperProfile: params.shopperProfile,
      categoryHint: params.categoryHint,
    }),
  }));

  const outfitIntent = hasAnyKeyword(params.normalizedMessage, [
    'outfit',
    'phoi do',
    'do di',
    'mac di',
    'set do',
  ]);

  const apparelOnly = scored.filter((item) => isLikelyApparel(item.product));
  const meaningfulApparel = apparelOnly.filter((item) => item.score > -1);

  const source =
    outfitIntent && meaningfulApparel.length > 0
      ? meaningfulApparel
      : scored.filter((item) => item.score > -4);

  return source
    .sort((a, b) => b.score - a.score || a.product.minPrice - b.product.minPrice)
    .map((item) => item.product);
}

function buildSearchCandidates(params: {
  categoryHint?: string;
  normalizedMessage: string;
  hasStructuredFilters: boolean;
}): string[] {
  if (params.categoryHint) {
    return [params.categoryHint];
  }

  // When we already extracted structured filters like occasion/budget/color/size,
  // avoid forcing a free-text search from the whole sentence because it can make
  // the product query overly strict (e.g. "goi y outfit di choi cuoi tuan").
  if (params.hasStructuredFilters) {
    return [];
  }

  const fallback = params.normalizedMessage
    .split(' ')
    .filter((token) => token.length > 2)
    .slice(0, 4)
    .join(' ');

  return fallback ? [fallback] : [];
}

export class ChatbotSalesAssistantService {
  constructor(private readonly productCatalog: IChatbotProductCatalog) {}

  async buildReply(session: ChatSessionRecord, userMessage: string): Promise<AssistantReply> {
    const previousProfile = (session.shopperProfile ?? {}) as ShopperProfile;
    const normalizedMessage = normalizeText(userMessage);
    const simpleIntent = detectSimpleChatbotIntent(userMessage);
    if (simpleIntent) {
      const simpleReply = buildSimpleChatbotReply(simpleIntent);
      return {
        content: simpleReply.content,
        status: session.status,
        shopperProfile: previousProfile as Record<string, unknown>,
        leadPhone: session.leadPhone,
        leadEmail: session.leadEmail,
        lastIntent: simpleReply.lastIntent,
        lastSummary: simpleReply.lastSummary,
        suggestedProducts: [],
        quickReplies: QUICK_REPLIES,
      };
    }

    const budget = extractBudget(userMessage);
    const pickedColor = pickColor(userMessage);
    const pickedSize = pickSize(userMessage);
    const pickedUsageOccasion = pickKeywordValue(userMessage, OCCASION_KEYWORDS);
    const pickedCategoryHint = pickCategoryHint(userMessage);
    const leadEmail = extractEmail(userMessage) ?? session.leadEmail;
    const leadPhone = extractPhone(userMessage) ?? session.leadPhone;
    const hasContact = Boolean(leadPhone || leadEmail);
    const hasNewShoppingSignal = Boolean(
      hasFashionShoppingIntent(userMessage) ||
        budget.min !== undefined ||
        budget.max !== undefined ||
        pickedColor ||
        pickedSize ||
        pickedUsageOccasion ||
        pickedCategoryHint,
    );

    if (!hasNewShoppingSignal && !hasContact) {
      return {
        content:
          'Mình có thể tư vấn sản phẩm thời trang trong shop AURA. Bạn cho mình biết cần đồ đi làm, đi chơi, màu/size nào hoặc ngân sách khoảng bao nhiêu nhé.',
        status: session.status,
        shopperProfile: previousProfile as Record<string, unknown>,
        leadPhone: session.leadPhone,
        leadEmail: session.leadEmail,
        lastIntent: 'qualify_need',
        lastSummary: 'missing_shopping_signal',
        suggestedProducts: [],
        quickReplies: QUICK_REPLIES,
      };
    }

    // Selecting a new occasion quick reply such as "outfit đi làm" should start
    // a fresh recommendation context instead of carrying stale color/budget filters.
    const baseProfile = pickedUsageOccasion ? {} : previousProfile;
    const color = pickedColor ?? baseProfile.color;
    const size = pickedSize ?? baseProfile.size;
    const usageOccasion = pickedUsageOccasion ?? baseProfile.usageOccasion;
    const categoryHint = pickedCategoryHint ?? baseProfile.categoryHint;

    const shopperProfile: ShopperProfile = {
      ...baseProfile,
      ...(budget.min !== undefined ? { budgetMin: budget.min } : {}),
      ...(budget.max !== undefined ? { budgetMax: budget.max } : {}),
      ...(color ? { color } : {}),
      ...(size ? { size } : {}),
      ...(usageOccasion ? { usageOccasion } : {}),
      ...(categoryHint ? { categoryHint } : {}),
    };

    const searchCandidates = buildSearchCandidates({
      categoryHint,
      normalizedMessage,
      hasStructuredFilters: Boolean(
        usageOccasion ||
        color ||
        size ||
        shopperProfile.budgetMin !== undefined ||
        shopperProfile.budgetMax !== undefined,
      ),
    });

    const searchAttempts: Array<{
      search?: string;
      category?: string;
      color?: string;
      size?: string;
      usageOccasion?: string;
      minPrice?: number;
      maxPrice?: number;
      limit: number;
    }> = [
      {
        search: searchCandidates[0],
        category: categoryHint,
        color,
        size,
        usageOccasion,
        minPrice: shopperProfile.budgetMin,
        maxPrice: shopperProfile.budgetMax,
        limit: 4,
      },
    ];

    if (searchCandidates.length === 0) {
      searchAttempts[0].search = undefined;
    }

    // Fallback: keep the structured filters but remove the free-text constraint.
    if (searchAttempts[0].search) {
      searchAttempts.push({
        ...searchAttempts[0],
        search: undefined,
      });
    }

    // Final fallback: if occasion mapping is too sparse in catalog data, still try to
    // recommend something relevant by category/budget/color/size instead of always failing.
    if (usageOccasion) {
      searchAttempts.push({
        ...searchAttempts[0],
        search: undefined,
        usageOccasion: undefined,
      });
    }

    let products: ChatbotCatalogProduct[] = [];
    for (const attempt of searchAttempts) {
      products = uniqueProducts(await this.productCatalog.searchProducts(attempt));
      if (products.length > 0) {
        break;
      }
    }

    const canRelaxBudget =
      shopperProfile.budgetMax === undefined || shopperProfile.budgetMax >= 100_000;

    if (products.length === 0 && canRelaxBudget) {
      products = uniqueProducts(await this.productCatalog.searchProducts({ limit: 8 }));
    }

    products = rerankProducts({
      products,
      normalizedMessage,
      shopperProfile,
      categoryHint,
    }).slice(0, 4);

    const status: ChatSessionStatus = hasContact
      ? 'CONTACT_CAPTURED'
      : products.length > 0
        ? 'QUALIFIED'
        : 'OPEN';

    const content = this.composeReply({
      shopperProfile,
      activeFilters: {
        usageOccasion,
        color,
        size,
        budgetMax: shopperProfile.budgetMax,
      },
      products,
      hasContact,
      leadPhone,
      leadEmail,
    });

    return {
      content,
      status,
      shopperProfile,
      leadPhone: leadPhone ?? null,
      leadEmail: leadEmail ?? null,
      lastIntent: hasContact
        ? 'capture_lead'
        : products.length > 0
          ? 'recommend_products'
          : 'qualify_need',
      lastSummary: this.buildSummary(shopperProfile, hasContact),
      suggestedProducts: products,
      quickReplies: QUICK_REPLIES,
    };
  }

  private composeReply(params: {
    shopperProfile: ShopperProfile;
    activeFilters: Pick<ShopperProfile, 'usageOccasion' | 'color' | 'size' | 'budgetMax'>;
    products: ChatbotCatalogProduct[];
    hasContact: boolean;
    leadPhone: string | null;
    leadEmail: string | null;
  }): string {
    const details: string[] = [];

    if (params.activeFilters.usageOccasion) {
      details.push(`nhu cầu ${formatUsageOccasion(params.activeFilters.usageOccasion)}`);
    }
    if (params.activeFilters.color) {
      details.push(`màu ${params.activeFilters.color}`);
    }
    if (params.activeFilters.size) {
      details.push(`size ${params.activeFilters.size}`);
    }
    if (params.activeFilters.budgetMax) {
      details.push(
        `ngân sách khoảng ${Math.round(params.activeFilters.budgetMax).toLocaleString('vi-VN')}đ`,
      );
    }

    if (params.products.length === 0) {
      return `Mình chưa thấy mẫu thật sự khớp trong kho hiện tại. Bạn giúp mình thêm 1-2 thông tin như mục đích mặc, màu ưu tiên hoặc ngân sách, mình sẽ lọc sát hơn.${params.hasContact ? ' Mình đã lưu thông tin liên hệ để đội ngũ hỗ trợ nếu bạn cần tư vấn sâu hơn.' : ''}`;
    }

    const opening = details.length
      ? `Mình đã lọc nhanh theo ${details.join(', ')} và thấy vài mẫu khá hợp.`
      : 'Mình đã chọn nhanh vài mẫu đang phù hợp và dễ phối trong shop.';

    if (params.hasContact) {
      return `${opening} Mình cũng đã lưu ${params.leadPhone ? `SĐT ${params.leadPhone}` : `email ${params.leadEmail}`} để đội ngũ tư vấn có thể liên hệ nếu bạn muốn giữ mẫu hoặc cần phối đồ chi tiết hơn.`;
    }

    return `${opening} Nếu muốn, bạn có thể nhắn thêm kiểu dáng, màu hoặc để lại SĐT/email để mình chuyển tiếp cho tư vấn viên.`;
  }

  private buildSummary(profile: ShopperProfile, hasContact: boolean): string {
    const chunks: string[] = [];

    if (profile.categoryHint) chunks.push(`category:${profile.categoryHint}`);
    if (profile.usageOccasion) chunks.push(`occasion:${profile.usageOccasion}`);
    if (profile.color) chunks.push(`color:${profile.color}`);
    if (profile.size) chunks.push(`size:${profile.size}`);
    if (profile.budgetMax) chunks.push(`budgetMax:${profile.budgetMax}`);
    if (hasContact) chunks.push('lead_captured');

    return chunks.join(', ') || 'awaiting_more_context';
  }
}
