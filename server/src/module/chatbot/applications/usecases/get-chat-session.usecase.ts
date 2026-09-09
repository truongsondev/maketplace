import { NotFoundError } from '@/error-handlling/notFoundError';
import { ChatSessionAccessContext } from '../dto/command/chat-session-access-context';
import { ChatSessionResult } from '../dto/result/chat-session.result';
import { IGetChatSessionUseCase } from '../ports/input/get-chat-session.usecase';
import { IChatSessionRepository } from '../ports/output/chat-session.repository';
import { assertCanAccessChatSession } from './chat-session-access';
import { toChatSessionResult } from './chat-session-result.mapper';

export class GetChatSessionUseCase implements IGetChatSessionUseCase {
  constructor(private readonly sessionRepository: IChatSessionRepository) {}

  async execute(sessionId: string, context: ChatSessionAccessContext): Promise<ChatSessionResult> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    assertCanAccessChatSession(session, context);
    return toChatSessionResult(session);
  }
}
