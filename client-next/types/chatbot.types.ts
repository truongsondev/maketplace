export interface ChatbotSuggestedProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  href: string;
}

export interface ChatbotQuickReply {
  label: string;
  value: string;
}

export interface ChatbotMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  suggestedProducts: ChatbotSuggestedProduct[];
  quickReplies: ChatbotQuickReply[];
}

export interface ChatbotSessionSummary {
  id: string;
  status: "OPEN" | "QUALIFIED" | "CONTACT_CAPTURED" | "ESCALATED" | "CLOSED";
  leadPhone: string | null;
  leadEmail: string | null;
  lastIntent: string | null;
  lastMessageAt: string;
}

export interface ChatbotSessionPayload {
  session: ChatbotSessionSummary;
  messages: ChatbotMessage[];
}
