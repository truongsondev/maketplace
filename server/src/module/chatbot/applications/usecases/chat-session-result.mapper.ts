import {
  ChatMessageRecord,
  ChatSessionRecord,
} from '../ports/output/chat-session.repository';
import { ChatSessionResult } from '../dto/result/chat-session.result';

function mapMessage(record: ChatMessageRecord) {
  const metadata = record.metadata ?? {};
  const suggestedProducts = Array.isArray(metadata.suggestedProducts)
    ? metadata.suggestedProducts
    : [];
  const quickReplies = Array.isArray(metadata.quickReplies) ? metadata.quickReplies : [];

  return {
    id: record.id,
    role: record.role,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
    suggestedProducts: suggestedProducts as ChatSessionResult['messages'][number]['suggestedProducts'],
    quickReplies: quickReplies as ChatSessionResult['messages'][number]['quickReplies'],
  };
}

export function toChatSessionResult(record: ChatSessionRecord): ChatSessionResult {
  return {
    session: {
      id: record.id,
      status: record.status,
      leadPhone: record.leadPhone,
      leadEmail: record.leadEmail,
      lastIntent: record.lastIntent,
      lastMessageAt: record.lastMessageAt.toISOString(),
    },
    messages: record.messages.map(mapMessage),
  };
}
