import { describe, expect, it, jest } from '@jest/globals';
import { ChatbotSalesAssistantService } from '../chatbot-sales-assistant.service';
import type { ChatSessionRecord } from '../../ports/output/chat-session.repository';
import type { IChatbotProductCatalog } from '../../ports/output/chatbot-product-catalog';

function makeSession(overrides: Partial<ChatSessionRecord> = {}): ChatSessionRecord {
  return {
    id: 'session-1',
    userId: 'user-1',
    status: 'OPEN',
    guestToken: null,
    leadName: null,
    leadPhone: null,
    leadEmail: null,
    budgetMin: null,
    budgetMax: null,
    shopperProfile: null,
    lastIntent: null,
    lastSummary: null,
    lastSuggestedProductIds: [],
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
    ...overrides,
  };
}

function makeCatalog(): IChatbotProductCatalog {
  return {
    searchProducts: jest.fn<IChatbotProductCatalog['searchProducts']>().mockResolvedValue([
      {
        id: 'product-1',
        name: 'Áo sơ mi trắng',
        imageUrl: null,
        minPrice: 250_000,
        href: '/products/product-1',
        categorySlugs: ['ao'],
        usageOccasions: ['di_lam'],
      },
    ]),
  };
}

describe('ChatbotSalesAssistantService', () => {
  it('replies naturally to a greeting without recommending products', async () => {
    const catalog = makeCatalog();
    const service = new ChatbotSalesAssistantService(catalog);

    const reply = await service.buildReply(makeSession(), 'Chào bạn');

    expect(reply.content).toContain('Chào bạn');
    expect(reply.lastIntent).toBe('greeting');
    expect(reply.suggestedProducts).toHaveLength(0);
    expect(catalog.searchProducts).not.toHaveBeenCalled();
  });

  it('keeps fashion product requests on the recommendation flow', async () => {
    const catalog = makeCatalog();
    const service = new ChatbotSalesAssistantService(catalog);

    const reply = await service.buildReply(makeSession(), 'Gợi ý áo đi làm dưới 500k');

    expect(reply.lastIntent).toBe('recommend_products');
    expect(reply.suggestedProducts).toHaveLength(1);
    expect(catalog.searchProducts).toHaveBeenCalled();
  });

  it('answers identity questions without searching products', async () => {
    const catalog = makeCatalog();
    const service = new ChatbotSalesAssistantService(catalog);

    const reply = await service.buildReply(makeSession(), 'Bạn là ai');

    expect(reply.lastIntent).toBe('identity');
    expect(reply.content).toContain('AURA Sales AI');
    expect(reply.suggestedProducts).toHaveLength(0);
    expect(catalog.searchProducts).not.toHaveBeenCalled();
  });

  it('does not recommend products for messages without shopping intent', async () => {
    const catalog = makeCatalog();
    const service = new ChatbotSalesAssistantService(catalog);

    const reply = await service.buildReply(makeSession(), 'Nói thêm đi');

    expect(reply.lastIntent).toBe('qualify_need');
    expect(reply.suggestedProducts).toHaveLength(0);
    expect(catalog.searchProducts).not.toHaveBeenCalled();
  });

  it('does not confuse "vậy sao" with a dress request in fallback mode', async () => {
    const catalog = makeCatalog();
    const service = new ChatbotSalesAssistantService(catalog);

    const reply = await service.buildReply(makeSession(), 'vậy sao');

    expect(reply.lastIntent).toBe('qualify_need');
    expect(reply.suggestedProducts).toHaveLength(0);
    expect(catalog.searchProducts).not.toHaveBeenCalled();
  });

  it('still treats accented dress requests as product intent', async () => {
    const catalog = makeCatalog();
    const service = new ChatbotSalesAssistantService(catalog);

    const reply = await service.buildReply(makeSession(), 'Gợi ý váy đen size M');

    expect(reply.lastIntent).toBe('recommend_products');
    expect(catalog.searchProducts).toHaveBeenCalled();
  });

  it('redirects out-of-scope requests back to fashion help', async () => {
    const catalog = makeCatalog();
    const service = new ChatbotSalesAssistantService(catalog);

    const reply = await service.buildReply(makeSession(), 'Có bán sex toy không');

    expect(reply.lastIntent).toBe('out_of_scope');
    expect(reply.content).toContain('tư vấn thời trang');
    expect(reply.suggestedProducts).toHaveLength(0);
    expect(catalog.searchProducts).not.toHaveBeenCalled();
  });
});
