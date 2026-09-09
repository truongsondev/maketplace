import { StartChatSessionCommand } from '../../applications/dto/command/start-chat-session.command';
import { SendChatMessageCommand } from '../../applications/dto/command/send-chat-message.command';
import { ChatSessionAccessContext } from '../../applications/dto/command/chat-session-access-context';
import { ChatSessionResult } from '../../applications/dto/result/chat-session.result';
import { IGetChatSessionUseCase } from '../../applications/ports/input/get-chat-session.usecase';
import { ISendChatMessageUseCase } from '../../applications/ports/input/send-chat-message.usecase';
import { IStartChatSessionUseCase } from '../../applications/ports/input/start-chat-session.usecase';

export class ChatbotController {
  constructor(
    private readonly startChatSessionUseCase: IStartChatSessionUseCase,
    private readonly getChatSessionUseCase: IGetChatSessionUseCase,
    private readonly sendChatMessageUseCase: ISendChatMessageUseCase,
  ) {}

  startSession(command: StartChatSessionCommand): Promise<ChatSessionResult> {
    return this.startChatSessionUseCase.execute(command);
  }

  getSession(sessionId: string, context: ChatSessionAccessContext): Promise<ChatSessionResult> {
    return this.getChatSessionUseCase.execute(sessionId, context);
  }

  sendMessage(command: SendChatMessageCommand): Promise<ChatSessionResult> {
    return this.sendChatMessageUseCase.execute(command);
  }
}
