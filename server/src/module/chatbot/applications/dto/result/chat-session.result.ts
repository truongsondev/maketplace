export interface ChatbotSuggestedProductResult {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  href: string;
}

export interface ChatbotQuickReplyResult {
  label: string;
  value: string;
}

export interface ChatbotMessageResult {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
  suggestedProducts: ChatbotSuggestedProductResult[];
  quickReplies: ChatbotQuickReplyResult[];
}

export interface ChatSessionSummaryResult {
  id: string;
  status: 'OPEN' | 'QUALIFIED' | 'CONTACT_CAPTURED' | 'ESCALATED' | 'CLOSED';
  leadPhone: string | null;
  leadEmail: string | null;
  lastIntent: string | null;
  lastMessageAt: string;
}

export interface ChatSessionResult {
  session: ChatSessionSummaryResult;
  messages: ChatbotMessageResult[];
}
