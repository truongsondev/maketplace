export type ChatMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type ChatSessionStatus = 'OPEN' | 'QUALIFIED' | 'CONTACT_CAPTURED' | 'ESCALATED' | 'CLOSED';

export interface ChatMessageRecord {
  id: string;
  role: ChatMessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ChatSessionRecord {
  id: string;
  userId: string | null;
  status: ChatSessionStatus;
  guestToken: string | null;
  leadName: string | null;
  leadPhone: string | null;
  leadEmail: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  shopperProfile: Record<string, unknown> | null;
  lastIntent: string | null;
  lastSummary: string | null;
  lastSuggestedProductIds: string[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessageRecord[];
}

export interface CreateChatSessionParams {
  userId?: string | null;
  guestToken?: string;
}

export interface ChatSessionUpdate {
  status?: ChatSessionStatus;
  leadName?: string | null;
  leadPhone?: string | null;
  leadEmail?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  shopperProfile?: Record<string, unknown> | null;
  lastIntent?: string | null;
  lastSummary?: string | null;
  lastSuggestedProductIds?: string[];
}

export interface IChatSessionRepository {
  create(params: CreateChatSessionParams): Promise<ChatSessionRecord>;
  findById(sessionId: string): Promise<ChatSessionRecord | null>;
  appendMessage(
    sessionId: string,
    role: ChatMessageRole,
    content: string,
    metadata?: Record<string, unknown> | null,
  ): Promise<ChatMessageRecord>;
  updateSession(sessionId: string, update: ChatSessionUpdate): Promise<ChatSessionRecord>;
}
