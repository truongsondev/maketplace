import {
  SearchProductsToolInput,
  SearchProductsToolResult,
} from '../../tools/search-products.tool';

export type ChatbotLLMRole = 'user' | 'model';

export interface ChatbotLLMTextPart {
  text: string;
}

export interface ChatbotLLMFunctionCallPart {
  functionCall: {
    name: string;
    args?: Record<string, unknown>;
  };
}

export interface ChatbotLLMFunctionResponsePart {
  functionResponse: {
    name: string;
    response: SearchProductsToolResult;
  };
}

export type ChatbotLLMPart =
  | ChatbotLLMTextPart
  | ChatbotLLMFunctionCallPart
  | ChatbotLLMFunctionResponsePart;

export interface ChatbotLLMContent {
  role: ChatbotLLMRole;
  parts: ChatbotLLMPart[];
}

export interface ChatbotLLMFunctionCall {
  name: 'searchProducts';
  args: SearchProductsToolInput;
}

export interface ChatbotLLMResponse {
  text: string;
  functionCalls: ChatbotLLMFunctionCall[];
}

export type ChatIntent =
  | 'product_search'
  | 'shop_question'
  | 'fashion_advice'
  | 'greeting'
  | 'thanks'
  | 'out_of_scope';

export interface ChatbotIntentFilters {
  keyword: string | null;
  category: string | null;
  color: string | null;
  size: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  occasion: string | null;
  style: string | null;
  gender: string | null;
}

export interface ChatbotIntentClassification {
  intent: ChatIntent;
  confidence: number;
  filters?: ChatbotIntentFilters;
}

export interface IChatbotLLMClient {
  classifyIntent(params: {
    systemInstruction: string;
    contents: ChatbotLLMContent[];
  }): Promise<ChatbotIntentClassification>;

  generate(params: {
    systemInstruction: string;
    contents: ChatbotLLMContent[];
    enableTools?: boolean;
  }): Promise<ChatbotLLMResponse>;
}
