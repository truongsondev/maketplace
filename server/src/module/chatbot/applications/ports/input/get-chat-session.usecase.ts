import { ChatSessionResult } from '../../dto/result/chat-session.result';
import { ChatSessionAccessContext } from '../../dto/command/chat-session-access-context';

export interface IGetChatSessionUseCase {
  execute(sessionId: string, context: ChatSessionAccessContext): Promise<ChatSessionResult>;
}
