import {
  ChatMessageRecord,
  ChatMessageRole,
  ChatSessionRecord,
  ChatSessionUpdate,
  CreateChatSessionParams,
  IChatSessionRepository,
} from '../../applications/ports/output/chat-session.repository';

function mapMessage(row: any): ChatMessageRecord {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt,
  };
}

function mapSession(row: any): ChatSessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    guestToken: row.guestToken,
    leadName: row.leadName,
    leadPhone: row.leadPhone,
    leadEmail: row.leadEmail,
    budgetMin: row.budgetMin === null ? null : Number(row.budgetMin),
    budgetMax: row.budgetMax === null ? null : Number(row.budgetMax),
    shopperProfile: row.shopperProfile as Record<string, unknown> | null,
    lastIntent: row.lastIntent,
    lastSummary: row.lastSummary,
    lastSuggestedProductIds: Array.isArray(row.lastSuggestedProductIds)
      ? row.lastSuggestedProductIds
      : [],
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messages: (row.messages ?? []).map(mapMessage),
  };
}

export class PrismaChatSessionRepository implements IChatSessionRepository {
  constructor(private readonly prisma: any) {}

  async create(params: CreateChatSessionParams): Promise<ChatSessionRecord> {
    const row = await this.prisma.chatSession.create({
      data: {
        guestToken: params.guestToken,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return mapSession(row);
  }

  async findById(sessionId: string): Promise<ChatSessionRecord | null> {
    const row = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return row ? mapSession(row) : null;
  }

  async appendMessage(
    sessionId: string,
    role: ChatMessageRole,
    content: string,
    metadata?: Record<string, unknown> | null,
  ): Promise<ChatMessageRecord> {
    const row = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        metadata: metadata ?? undefined,
      },
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessageAt: row.createdAt,
      },
    });

    return mapMessage(row);
  }

  async updateSession(sessionId: string, update: ChatSessionUpdate): Promise<ChatSessionRecord> {
    const row = await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        ...(update.status ? { status: update.status } : {}),
        ...(update.leadName !== undefined ? { leadName: update.leadName } : {}),
        ...(update.leadPhone !== undefined ? { leadPhone: update.leadPhone } : {}),
        ...(update.leadEmail !== undefined ? { leadEmail: update.leadEmail } : {}),
        ...(update.budgetMin !== undefined ? { budgetMin: update.budgetMin } : {}),
        ...(update.budgetMax !== undefined ? { budgetMax: update.budgetMax } : {}),
        ...(update.shopperProfile !== undefined ? { shopperProfile: update.shopperProfile } : {}),
        ...(update.lastIntent !== undefined ? { lastIntent: update.lastIntent } : {}),
        ...(update.lastSummary !== undefined ? { lastSummary: update.lastSummary } : {}),
        ...(update.lastSuggestedProductIds !== undefined
          ? { lastSuggestedProductIds: update.lastSuggestedProductIds }
          : {}),
      },
      include: {
        messages: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return mapSession(row);
  }
}
