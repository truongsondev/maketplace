import { SendChatMessageCommand } from '../../dto/command/send-chat-message.command';
import { ChatSessionResult } from '../../dto/result/chat-session.result';

export interface ISendChatMessageUseCase {
  execute(command: SendChatMessageCommand): Promise<ChatSessionResult>;
}
