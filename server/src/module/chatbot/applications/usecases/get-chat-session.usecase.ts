import { NotFoundError } from '@/error-handlling/notFoundError';
import { ChatSessionResult } from '../dto/result/chat-session.result';
import { IGetChatSessionUseCase } from '../ports/input/get-chat-session.usecase';
import { IChatSessionRepository } from '../ports/output/chat-session.repository';
import { toChatSessionResult } from './chat-session-result.mapper';

export class GetChatSessionUseCase implements IGetChatSessionUseCase {
  constructor(private readonly sessionRepository: IChatSessionRepository) {}

  async execute(sessionId: string): Promise<ChatSessionResult> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    return toChatSessionResult(session);
  }
}
