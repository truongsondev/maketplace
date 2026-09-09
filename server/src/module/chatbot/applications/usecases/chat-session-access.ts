import { ForbiddenError } from '@/error-handlling/forbiddenError';
import { ChatSessionAccessContext } from '../dto/command/chat-session-access-context';
import { ChatSessionRecord } from '../ports/output/chat-session.repository';

export type { ChatSessionAccessContext };

export function assertCanAccessChatSession(
  session: ChatSessionRecord,
  context: ChatSessionAccessContext,
): void {
  if (session.userId) {
    if (context.userId === session.userId) return;
    throw new ForbiddenError('You do not have access to this chat session');
  }

  if (session.guestToken && context.guestToken === session.guestToken) {
    return;
  }

  if (!session.guestToken && !context.userId) {
    return;
  }

  throw new ForbiddenError('You do not have access to this chat session');
}
