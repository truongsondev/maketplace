import { StartChatSessionCommand } from '../../dto/command/start-chat-session.command';
import { ChatSessionResult } from '../../dto/result/chat-session.result';

export interface IStartChatSessionUseCase {
  execute(command: StartChatSessionCommand): Promise<ChatSessionResult>;
}
