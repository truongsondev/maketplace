import { ChatSessionResult } from '../../dto/result/chat-session.result';

export interface IGetChatSessionUseCase {
  execute(sessionId: string): Promise<ChatSessionResult>;
}
