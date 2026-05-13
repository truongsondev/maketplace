import { NotFoundError } from '@/error-handlling/notFoundError';
import { createLogger } from '@/shared/util/logger';
import { SendChatMessageCommand } from '../dto/command/send-chat-message.command';
import { ChatSessionResult } from '../dto/result/chat-session.result';
import { ISendChatMessageUseCase } from '../ports/input/send-chat-message.usecase';
import { IChatSessionRepository } from '../ports/output/chat-session.repository';
import { ChatbotSalesAssistantService } from '../services/chatbot-sales-assistant.service';
import { toChatSessionResult } from './chat-session-result.mapper';

export class SendChatMessageUseCase implements ISendChatMessageUseCase {
  private readonly logger = createLogger('SendChatMessageUseCase');

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly salesAssistant: ChatbotSalesAssistantService,
  ) {}

  async execute(command: SendChatMessageCommand): Promise<ChatSessionResult> {
    const session = await this.sessionRepository.findById(command.sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    await this.sessionRepository.appendMessage(session.id, 'USER', command.content);
    const updatedSession = await this.sessionRepository.findById(session.id);
    if (!updatedSession) {
      throw new NotFoundError('Chat session not found after appending message');
    }

    const reply = await this.salesAssistant.buildReply(updatedSession, command.content);

    await this.sessionRepository.updateSession(session.id, {
      status: reply.status,
      leadPhone: reply.leadPhone,
      leadEmail: reply.leadEmail,
      shopperProfile: reply.shopperProfile,
      budgetMin:
        typeof reply.shopperProfile.budgetMin === 'number'
          ? reply.shopperProfile.budgetMin
          : updatedSession.budgetMin,
      budgetMax:
        typeof reply.shopperProfile.budgetMax === 'number'
          ? reply.shopperProfile.budgetMax
          : updatedSession.budgetMax,
      lastIntent: reply.lastIntent,
      lastSummary: reply.lastSummary,
      lastSuggestedProductIds: reply.suggestedProducts.map((product) => product.id),
    });

    await this.sessionRepository.appendMessage(session.id, 'ASSISTANT', reply.content, {
      suggestedProducts: reply.suggestedProducts,
      quickReplies: reply.quickReplies,
    });

    const reloaded = await this.sessionRepository.findById(session.id);
    if (!reloaded) {
      throw new NotFoundError('Chat session not found after assistant reply');
    }

    this.logger.info('Chat session replied', {
      sessionId: reloaded.id,
      status: reloaded.status,
      suggestedCount: reply.suggestedProducts.length,
    });

    return toChatSessionResult(reloaded);
  }
}
