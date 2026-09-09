import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from '@/shared/util/logger';
import {
  ChatMessageRecord,
  ChatSessionRecord,
  ChatSessionStatus,
} from '../ports/output/chat-session.repository';
import {
  ChatbotIntentClassification,
  ChatbotIntentFilters,
  ChatbotLLMContent,
  IChatbotLLMClient,
} from '../ports/output/chatbot-llm-client';
import { ChatbotCatalogProduct } from '../ports/output/chatbot-product-catalog';
import { SearchProductsTool, SearchProductsToolInput } from '../tools/search-products.tool';
import { AssistantReply } from './chatbot-sales-assistant.service';

interface ChatbotLLMOrchestratorOptions {
  enabled: boolean;
  maxToolCalls: number;
  provider: string;
  model: string;
}

const QUICK_REPLIES = [
  { label: 'Đồ đi làm', value: 'Mình cần outfit đi làm' },
  { label: 'Đồ đi chơi', value: 'Gợi ý outfit đi chơi cuối tuần' },
  { label: 'Ngân sách 500k', value: 'Ngân sách của mình khoảng 500k' },
  { label: 'Để lại SĐT', value: 'Số điện thoại của mình là 0901234567' },
];

const OUT_OF_SCOPE_REPLY =
  'Mình chỉ là trợ lý AI của AURA, hiện mình chỉ hỗ trợ tư vấn thời trang và sản phẩm trong shop. Bạn vui lòng không hỏi nội dung ngoài phạm vi này nhé.';

const DEFAULT_FILTERS: ChatbotIntentFilters = {
  keyword: null,
  category: null,
  color: null,
  size: null,
  budgetMin: null,
  budgetMax: null,
  occasion: null,
  style: null,
  gender: null,
};

function mapHistory(messages: ChatMessageRecord[]): ChatbotLLMContent[] {
  return messages
    .filter((message) => message.role === 'USER' || message.role === 'ASSISTANT')
    .slice(-12)
    .map((message) => ({
      role: message.role === 'USER' ? 'user' : 'model',
      parts: [{ text: message.content }],
    }));
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

function getLastUserText(contents: ChatbotLLMContent[]): string {
  const lastUserContent = [...contents].reverse().find((content) => content.role === 'user');
  return (
    lastUserContent?.parts
      .map((part) => ('text' in part ? part.text : ''))
      .join('\n')
      .trim() ?? ''
  );
}

function isShopKnowledgeQuestion(content: string): boolean {
  const normalized = normalizeText(content);
  return (
    normalized.includes('gioi thieu ve aura') ||
    normalized.includes('aura la gi') ||
    normalized.includes('shop aura') ||
    normalized.includes('aura ban gi') ||
    normalized.includes('aura ho tro gi') ||
    normalized.includes('ve aura') ||
    normalized.includes('doi tra') ||
    normalized.includes('tra hang') ||
    normalized.includes('hoan hang') ||
    normalized.includes('phi ship') ||
    normalized.includes('free ship') ||
    normalized.includes('mien phi van chuyen') ||
    normalized.includes('van chuyen') ||
    normalized.includes('dia chi') ||
    normalized.includes('shop o dau') ||
    normalized.includes('aura o dau')
  );
}

function buildIntentClassifierInstruction(): string {
  return [
    'Bạn là intent classifier cho chatbot thương mại điện tử thời trang AURA.',
    'Chỉ trả về JSON hợp lệ, không markdown, không giải thích.',
    'Intent hợp lệ: product_search, shop_question, fashion_advice, greeting, thanks, out_of_scope.',
    'product_search: người dùng muốn tìm, mua, hỏi có sản phẩm, gợi ý sản phẩm hoặc outfit cụ thể trong shop.',
    'shop_question: người dùng hỏi giới thiệu về AURA/shop AURA, chính sách đổi trả, vận chuyển, phí ship, thanh toán, địa chỉ, COD, bảo hành, thời gian giao hàng.',
    'fashion_advice: người dùng hỏi tư vấn phối đồ/phong cách nhưng chưa yêu cầu tìm sản phẩm cụ thể.',
    'greeting: lời chào, hỏi bạn là ai, hỏi bạn hỗ trợ được gì.',
    'thanks: cảm ơn hoặc kết thúc lịch sự.',
    'out_of_scope: nội dung không liên quan thời trang, sản phẩm, mua sắm hoặc chính sách shop.',
    'Với product_search, extract filters gồm keyword, category, color, size, budgetMin, budgetMax, occasion, style, gender.',
    'Nếu không chắc một filter, đặt null. confidence là số từ 0 đến 1.',
    'Schema bắt buộc:',
    '{"intent":"product_search","confidence":0.95,"filters":{"keyword":null,"category":null,"color":null,"size":null,"budgetMin":null,"budgetMax":null,"occasion":null,"style":null,"gender":null}}',
  ].join('\n');
}

function buildProductAnswerInstruction(): string {
  return [
    'Bạn là AURA Stylist Assistant.',
    'Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, thân thiện.',
    'Chỉ giới thiệu sản phẩm có trong PRODUCT_RESULTS.',
    'Không bịa sản phẩm, giá, tồn kho hoặc khuyến mãi.',
    'Nếu PRODUCT_RESULTS rỗng, nói chưa thấy mẫu khớp trong kho hiện tại và hỏi đúng 1 câu để lọc tiếp.',
    'Nên nhắc tên 1-3 sản phẩm phù hợp nhất, giá dùng đúng minPrice nếu có.',
  ].join('\n');
}

function buildShopQuestionInstruction(): string {
  return [
    'Bạn là trợ lý chính sách của shop thời trang AURA.',
    'Chỉ trả lời dựa trên SHOP_KNOWLEDGE được cung cấp.',
    'Không bịa chính sách, thời gian, địa chỉ, phí hoặc điều kiện ngoài knowledge.',
    'Nếu knowledge chưa có thông tin, nói hiện chưa có thông tin trong dữ liệu shop và đề nghị khách liên hệ shop.',
    'Trả lời tiếng Việt ngắn gọn, rõ ràng.',
  ].join('\n');
}

function buildFashionAdviceInstruction(): string {
  return [
    'Bạn là stylist AI của AURA.',
    'Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, thực tế.',
    'Tư vấn thời trang theo câu hỏi, không bịa sản phẩm cụ thể.',
    'Kết thúc bằng CTA nhẹ: "Bạn muốn mình gợi ý vài mẫu phù hợp trong shop không?"',
  ].join('\n');
}

function buildGreetingInstruction(): string {
  return [
    'Bạn là AURA Sales AI, trợ lý chọn đồ của shop thời trang AURA.',
    'Trả lời ngắn gọn, thân thiện bằng tiếng Việt.',
    'Có thể nói bạn hỗ trợ tìm sản phẩm, tư vấn phối đồ và trả lời chính sách shop.',
  ].join('\n');
}

function buildThanksInstruction(): string {
  return [
    'Bạn là trợ lý mua sắm của AURA.',
    'Trả lời lời cảm ơn thật ngắn gọn, tự nhiên, thân thiện bằng tiếng Việt.',
  ].join('\n');
}

function normalizeFilters(filters: ChatbotIntentFilters | undefined): ChatbotIntentFilters {
  return filters ?? DEFAULT_FILTERS;
}

function mapFiltersToToolInput(filters: ChatbotIntentFilters): SearchProductsToolInput {
  return {
    search: filters.keyword ?? filters.style ?? undefined,
    category: filters.category ?? undefined,
    color: filters.color ?? undefined,
    size: filters.size ?? undefined,
    usageOccasion: filters.occasion ?? undefined,
    minPrice: filters.budgetMin ?? undefined,
    maxPrice: filters.budgetMax ?? undefined,
    limit: 4,
  };
}

function buildToolSummary(input: SearchProductsToolInput, count: number): string {
  const chunks = Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${String(value)}`);

  return [...chunks, `toolResultCount:${count}`].join(', ');
}

function formatProductResults(products: ChatbotCatalogProduct[]): string {
  if (products.length === 0) return '[]';

  return JSON.stringify(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      minPrice: product.minPrice,
      href: product.href,
      categorySlugs: product.categorySlugs ?? [],
      usageOccasions: product.usageOccasions ?? [],
    })),
  );
}

function buildKnowledgePathCandidates(): string[] {
  return [
    join(process.cwd(), 'resources', 'chatbot', 'shop-knowledge'),
    join(process.cwd(), 'dist', 'resources', 'chatbot', 'shop-knowledge'),
    join(process.cwd(), 'src', 'module', 'chatbot', 'shop-knowledge'),
    join(process.cwd(), 'server', 'src', 'module', 'chatbot', 'shop-knowledge'),
  ];
}

function loadShopKnowledge(): string {
  const filenames = ['aura.md', 'policy.md', 'shipping.md', 'payment.md'];

  for (const directory of buildKnowledgePathCandidates()) {
    if (!existsSync(directory)) continue;

    const chunks = filenames
      .map((filename) => {
        const filePath = join(directory, filename);
        if (!existsSync(filePath)) return null;
        return `# ${filename}\n${readFileSync(filePath, 'utf8')}`;
      })
      .filter((chunk): chunk is string => Boolean(chunk));

    if (chunks.length > 0) {
      return chunks.join('\n\n');
    }
  }

  return 'Chưa có dữ liệu chính sách shop trong knowledge base.';
}

export class ChatbotLLMOrchestratorService {
  private readonly logger = createLogger('ChatbotLLMOrchestratorService');

  constructor(
    private readonly llmClient: IChatbotLLMClient,
    private readonly searchProductsTool: SearchProductsTool,
    private readonly options: ChatbotLLMOrchestratorOptions,
  ) {}

  isEnabled(): boolean {
    return this.options.enabled && this.options.provider === 'gemini';
  }

  async buildReply(session: ChatSessionRecord, userMessage: string): Promise<AssistantReply> {
    if (!this.isEnabled()) {
      throw new Error('Chatbot LLM is disabled');
    }

    const startedAt = Date.now();
    const contents = mapHistory(session.messages);
    const leadPhone = extractPhone(userMessage) ?? session.leadPhone;
    const leadEmail = extractEmail(userMessage) ?? session.leadEmail;
    const hasContact = Boolean(leadPhone || leadEmail);
    const classification = await this.classifyIntent(contents, session.id);

    this.logger.info('Chatbot intent classified', {
      sessionId: session.id,
      intent: classification.intent,
      confidence: classification.confidence,
      provider: this.options.provider,
      model: this.options.model,
    });

    switch (classification.intent) {
      case 'product_search':
        return this.buildProductSearchReply({
          session,
          contents,
          userMessage,
          classification,
          leadPhone,
          leadEmail,
          hasContact,
          startedAt,
        });

      case 'shop_question':
        return this.buildSimpleLLMReply({
          session,
          contents: this.withTextContext(contents, `SHOP_KNOWLEDGE:\n${loadShopKnowledge()}`),
          systemInstruction: buildShopQuestionInstruction(),
          lastIntent: 'shop_question',
          lastSummary: 'llm_shop_knowledge',
          leadPhone,
          leadEmail,
          status: hasContact ? 'CONTACT_CAPTURED' : session.status,
          fallbackContent:
            'Hiện mình chưa có đủ thông tin chính sách trong dữ liệu shop. Bạn liên hệ AURA để được hỗ trợ chính xác hơn nhé.',
          startedAt,
        });

      case 'fashion_advice':
        return this.buildSimpleLLMReply({
          session,
          contents,
          systemInstruction: buildFashionAdviceInstruction(),
          lastIntent: 'fashion_advice',
          lastSummary: 'llm_fashion_advice',
          leadPhone,
          leadEmail,
          status: hasContact ? 'CONTACT_CAPTURED' : session.status,
          fallbackContent:
            'Bạn nên chọn outfit theo dáng người, dịp mặc và màu da để dễ phối hơn. Bạn muốn mình gợi ý vài mẫu phù hợp trong shop không?',
          startedAt,
        });

      case 'greeting':
        return this.buildSimpleLLMReply({
          session,
          contents,
          systemInstruction: buildGreetingInstruction(),
          lastIntent: 'greeting',
          lastSummary: 'llm_greeting',
          leadPhone,
          leadEmail,
          status: hasContact ? 'CONTACT_CAPTURED' : session.status,
          fallbackContent:
            'Chào bạn, mình là AURA Sales AI. Mình có thể tư vấn phối đồ, tìm sản phẩm trong shop và trả lời chính sách mua hàng.',
          startedAt,
        });

      case 'thanks':
        return this.buildSimpleLLMReply({
          session,
          contents,
          systemInstruction: buildThanksInstruction(),
          lastIntent: 'thanks',
          lastSummary: 'llm_thanks',
          leadPhone,
          leadEmail,
          status: hasContact ? 'CONTACT_CAPTURED' : session.status,
          fallbackContent:
            'Rất vui được hỗ trợ bạn. Khi cần tìm thêm đồ theo dịp mặc, màu, size hoặc ngân sách, bạn cứ nhắn mình nhé.',
          startedAt,
        });

      case 'out_of_scope':
        return this.buildOutOfScopeReply(session, leadPhone, leadEmail, hasContact);
    }
  }

  private async classifyIntent(
    contents: ChatbotLLMContent[],
    sessionId: string,
  ): Promise<ChatbotIntentClassification> {
    if (isShopKnowledgeQuestion(getLastUserText(contents))) {
      return {
        intent: 'shop_question',
        confidence: 1,
      };
    }

    try {
      return await this.llmClient.classifyIntent({
        systemInstruction: buildIntentClassifierInstruction(),
        contents,
      });
    } catch (error) {
      this.logger.warn('Chatbot intent classification failed', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        intent: 'out_of_scope',
        confidence: 0,
      };
    }
  }

  private async buildProductSearchReply(params: {
    session: ChatSessionRecord;
    contents: ChatbotLLMContent[];
    userMessage: string;
    classification: ChatbotIntentClassification;
    leadPhone: string | null;
    leadEmail: string | null;
    hasContact: boolean;
    startedAt: number;
  }): Promise<AssistantReply> {
    const filters = normalizeFilters(params.classification.filters);
    const toolInput = mapFiltersToToolInput(filters);
    const toolResult = await this.searchProductsTool.execute(toolInput);
    const suggestedProducts = toolResult.items;
    const answerContents = this.withTextContext(
      params.contents,
      [
        `USER_MESSAGE:\n${params.userMessage}`,
        `EXTRACTED_FILTERS:\n${JSON.stringify(filters)}`,
        `PRODUCT_RESULTS:\n${formatProductResults(suggestedProducts)}`,
      ].join('\n\n'),
    );

    const response = await this.llmClient.generate({
      systemInstruction: buildProductAnswerInstruction(),
      contents: answerContents,
      enableTools: false,
    });

    const status: ChatSessionStatus = params.hasContact
      ? 'CONTACT_CAPTURED'
      : suggestedProducts.length > 0
        ? 'QUALIFIED'
        : 'OPEN';

    this.logger.info('Chatbot product_search routed', {
      sessionId: params.session.id,
      durationMs: Date.now() - params.startedAt,
      suggestedCount: suggestedProducts.length,
      maxToolCalls: this.options.maxToolCalls,
    });

    return {
      content:
        response.text ||
        'Mình chưa thấy mẫu thật sự khớp trong kho hiện tại. Bạn cho mình thêm màu, size hoặc ngân sách để lọc sát hơn nhé.',
      status,
      shopperProfile: {
        ...(params.session.shopperProfile ?? {}),
        ...(filters.budgetMin !== null ? { budgetMin: filters.budgetMin } : {}),
        ...(filters.budgetMax !== null ? { budgetMax: filters.budgetMax } : {}),
        ...(filters.color !== null ? { color: filters.color } : {}),
        ...(filters.size !== null ? { size: filters.size } : {}),
        ...(filters.occasion !== null ? { usageOccasion: filters.occasion } : {}),
        ...(filters.category !== null ? { categoryHint: filters.category } : {}),
      },
      leadPhone: params.leadPhone,
      leadEmail: params.leadEmail,
      lastIntent: suggestedProducts.length > 0 ? 'recommend_products' : 'qualify_need',
      lastSummary: buildToolSummary(toolInput, suggestedProducts.length),
      suggestedProducts,
      quickReplies: QUICK_REPLIES,
    };
  }

  private async buildSimpleLLMReply(params: {
    session: ChatSessionRecord;
    contents: ChatbotLLMContent[];
    systemInstruction: string;
    lastIntent: string;
    lastSummary: string;
    leadPhone: string | null;
    leadEmail: string | null;
    status: ChatSessionStatus;
    fallbackContent: string;
    startedAt: number;
  }): Promise<AssistantReply> {
    const response = await this.llmClient.generate({
      systemInstruction: params.systemInstruction,
      contents: params.contents,
      enableTools: false,
    });

    this.logger.info('Chatbot LLM routed', {
      sessionId: params.session.id,
      lastIntent: params.lastIntent,
      durationMs: Date.now() - params.startedAt,
    });

    return {
      content: response.text || params.fallbackContent,
      status: params.status,
      shopperProfile: params.session.shopperProfile ?? {},
      leadPhone: params.leadPhone,
      leadEmail: params.leadEmail,
      lastIntent: params.lastIntent,
      lastSummary: params.lastSummary,
      suggestedProducts: [],
      quickReplies: QUICK_REPLIES,
    };
  }

  private buildOutOfScopeReply(
    session: ChatSessionRecord,
    leadPhone: string | null,
    leadEmail: string | null,
    hasContact: boolean,
  ): AssistantReply {
    return {
      content: OUT_OF_SCOPE_REPLY,
      status: hasContact ? 'CONTACT_CAPTURED' : session.status,
      shopperProfile: session.shopperProfile ?? {},
      leadPhone,
      leadEmail,
      lastIntent: 'out_of_scope',
      lastSummary: 'llm_out_of_scope',
      suggestedProducts: [],
      quickReplies: QUICK_REPLIES,
    };
  }

  private withTextContext(contents: ChatbotLLMContent[], text: string): ChatbotLLMContent[] {
    return [
      ...contents,
      {
        role: 'user',
        parts: [{ text }],
      },
    ];
  }
}
