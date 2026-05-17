import { createLogger } from '@/shared/util/logger';
import {
  ChatIntent,
  ChatbotIntentClassification,
  ChatbotIntentFilters,
  ChatbotLLMContent,
  ChatbotLLMFunctionCall,
  ChatbotLLMPart,
  ChatbotLLMResponse,
  IChatbotLLMClient,
} from '../../applications/ports/output/chatbot-llm-client';
import { SearchProductsToolInput } from '../../applications/tools/search-products.tool';

export interface GeminiChatClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

function isFunctionCallPart(part: ChatbotLLMPart): part is ChatbotLLMPart & {
  functionCall: { name: string; args?: Record<string, unknown> };
} {
  return 'functionCall' in part;
}

function isTextPart(part: ChatbotLLMPart): part is ChatbotLLMPart & { text: string } {
  return 'text' in part;
}

function toSearchProductsInput(args: Record<string, unknown> | undefined): SearchProductsToolInput {
  return {
    search: typeof args?.search === 'string' ? args.search : undefined,
    category: typeof args?.category === 'string' ? args.category : undefined,
    color: typeof args?.color === 'string' ? args.color : undefined,
    size: typeof args?.size === 'string' ? args.size : undefined,
    usageOccasion: typeof args?.usageOccasion === 'string' ? args.usageOccasion : undefined,
    minPrice: typeof args?.minPrice === 'number' ? args.minPrice : undefined,
    maxPrice: typeof args?.maxPrice === 'number' ? args.maxPrice : undefined,
    limit: typeof args?.limit === 'number' ? args.limit : undefined,
  };
}

const CHAT_INTENTS: readonly ChatIntent[] = [
  'product_search',
  'shop_question',
  'fashion_advice',
  'greeting',
  'thanks',
  'out_of_scope',
];

const EMPTY_FILTERS: ChatbotIntentFilters = {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

function normalizeIntent(value: unknown): ChatIntent {
  return typeof value === 'string' && CHAT_INTENTS.includes(value as ChatIntent)
    ? (value as ChatIntent)
    : 'out_of_scope';
}

function normalizeFilters(value: unknown): ChatbotIntentFilters {
  if (!isRecord(value)) return EMPTY_FILTERS;

  return {
    keyword: normalizeNullableString(value.keyword),
    category: normalizeNullableString(value.category),
    color: normalizeNullableString(value.color),
    size: normalizeNullableString(value.size),
    budgetMin: normalizeNullableNumber(value.budgetMin),
    budgetMax: normalizeNullableNumber(value.budgetMax),
    occasion: normalizeNullableString(value.occasion),
    style: normalizeNullableString(value.style),
    gender: normalizeNullableString(value.gender),
  };
}

function parseIntentClassification(rawText: string): ChatbotIntentClassification {
  const trimmed = rawText.trim();
  const jsonText =
    trimmed.startsWith('{') && trimmed.endsWith('}')
      ? trimmed
      : (trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed);

  const parsed: unknown = JSON.parse(jsonText);
  if (!isRecord(parsed)) {
    return { intent: 'out_of_scope', confidence: 0 };
  }

  const confidence =
    typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
      ? Math.min(Math.max(parsed.confidence, 0), 1)
      : 0;
  const intent = normalizeIntent(parsed.intent);

  return {
    intent,
    confidence,
    ...(intent === 'product_search' ? { filters: normalizeFilters(parsed.filters) } : {}),
  };
}

export class GeminiChatClient implements IChatbotLLMClient {
  private readonly logger = createLogger('GeminiChatClient');

  constructor(private readonly options: GeminiChatClientOptions) {}

  async classifyIntent(params: {
    systemInstruction: string;
    contents: ChatbotLLMContent[];
  }): Promise<ChatbotIntentClassification> {
    if (!this.options.apiKey) {
      throw new Error('GEMINI_API_KEY is required when chatbot LLM is enabled');
    }

    const text = await this.generateIntentClassifierText(params);

    return parseIntentClassification(text);
  }

  async generate(params: {
    systemInstruction: string;
    contents: ChatbotLLMContent[];
    enableTools?: boolean;
  }): Promise<ChatbotLLMResponse> {
    const payload = await this.generateRawPayload({
      systemInstruction: params.systemInstruction,
      contents: params.contents,
      tools:
        params.enableTools === false
          ? undefined
          : [
              {
                functionDeclarations: [
                  {
                    name: 'searchProducts',
                    description:
                      'Tim san pham that trong catalog AURA theo nhu cau thoi trang cua khach hang.',
                    parameters: {
                      type: 'OBJECT',
                      properties: {
                        search: { type: 'STRING' },
                        category: { type: 'STRING' },
                        color: { type: 'STRING' },
                        size: { type: 'STRING' },
                        usageOccasion: { type: 'STRING' },
                        minPrice: { type: 'NUMBER' },
                        maxPrice: { type: 'NUMBER' },
                        limit: { type: 'NUMBER' },
                      },
                    },
                  },
                ],
              },
            ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 700,
      },
    });

    const parts = payload.candidates?.[0]?.content?.parts ?? [];
    return {
      text: parts
        .filter(isTextPart)
        .map((part) => part.text)
        .join('\n')
        .trim(),
      functionCalls: parts
        .filter(isFunctionCallPart)
        .filter((part) => part.functionCall.name === 'searchProducts')
        .map<ChatbotLLMFunctionCall>((part) => ({
          name: 'searchProducts',
          args: toSearchProductsInput(part.functionCall.args),
        })),
    };
  }

  private async generateRawText(params: {
    systemInstruction: string;
    contents: ChatbotLLMContent[];
    generationConfig: Record<string, unknown>;
    suppressNonOkLog?: boolean;
  }): Promise<string> {
    const payload = await this.generateRawPayload(params);
    const parts = payload.candidates?.[0]?.content?.parts ?? [];
    return parts
      .filter(isTextPart)
      .map((part) => part.text)
      .join('\n')
      .trim();
  }

  private async generateIntentClassifierText(params: {
    systemInstruction: string;
    contents: ChatbotLLMContent[];
  }): Promise<string> {
    const baseGenerationConfig = {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 300,
    };

    try {
      return await this.generateRawText({
        systemInstruction: params.systemInstruction,
        contents: params.contents,
        suppressNonOkLog: true,
        generationConfig: {
          ...baseGenerationConfig,
          responseMimeType: 'application/json',
        },
      });
    } catch (error) {
      this.logger.info('Gemini JSON mode classification unavailable, retrying without JSON mode', {
        error: error instanceof Error ? error.message : String(error),
      });

      return this.generateRawText({
        systemInstruction: [
          params.systemInstruction,
          'Quan trọng: trả về duy nhất một object JSON thô, không dùng markdown/code fence.',
        ].join('\n'),
        contents: params.contents,
        generationConfig: baseGenerationConfig,
      });
    }
  }

  private async generateRawPayload(params: {
    systemInstruction: string;
    contents: ChatbotLLMContent[];
    tools?: unknown[];
    generationConfig: Record<string, unknown>;
    suppressNonOkLog?: boolean;
  }): Promise<{
    candidates?: Array<{
      content?: {
        parts?: ChatbotLLMPart[];
      };
    }>;
  }> {
    if (!this.options.apiKey) {
      throw new Error('GEMINI_API_KEY is required when chatbot LLM is enabled');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        this.options.model,
      )}:generateContent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.options.apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: params.systemInstruction }],
          },
          contents: params.contents,
          tools: params.tools,
          generationConfig: params.generationConfig,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        if (params.suppressNonOkLog !== true) {
          this.logger.warn('Gemini API returned non-OK response', {
            model: this.options.model,
            status: response.status,
            body: body.slice(0, 500),
          });
        }
        throw new Error(
          `Gemini API failed with status ${response.status} for model ${this.options.model}: ${body.slice(0, 240)}`,
        );
      }

      return (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: ChatbotLLMPart[];
          };
        }>;
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
