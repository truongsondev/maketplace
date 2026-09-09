import { NotFoundError } from '@/error-handlling/notFoundError';
import { createLogger } from '@/shared/util/logger';
import { SendChatMessageCommand } from '../dto/command/send-chat-message.command';
import { ChatSessionResult } from '../dto/result/chat-session.result';
import { ISendChatMessageUseCase } from '../ports/input/send-chat-message.usecase';
import { IChatSessionRepository } from '../ports/output/chat-session.repository';
import { ChatbotLLMOrchestratorService } from '../services/chatbot-llm-orchestrator.service';
import { ChatbotSalesAssistantService } from '../services/chatbot-sales-assistant.service';
import { assertCanAccessChatSession } from './chat-session-access';
import { toChatSessionResult } from './chat-session-result.mapper';

export class SendChatMessageUseCase implements ISendChatMessageUseCase {
  private readonly logger = createLogger('SendChatMessageUseCase');

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly salesAssistant: ChatbotSalesAssistantService,
    private readonly llmOrchestrator?: ChatbotLLMOrchestratorService,
  ) {}

  async execute(command: SendChatMessageCommand): Promise<ChatSessionResult> {
    const session = await this.sessionRepository.findById(command.sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    assertCanAccessChatSession(session, {
      userId: command.userId ?? null,
      guestToken: command.guestToken ?? null,
    });

    await this.sessionRepository.appendMessage(session.id, 'USER', command.content);
    const updatedSession = await this.sessionRepository.findById(session.id);
    if (!updatedSession) {
      throw new NotFoundError('Chat session not found after appending message');
    }

    const reply =
      this.llmOrchestrator?.isEnabled() === true
        ? await this.buildLLMReplyWithFallback(updatedSession)
        : await this.salesAssistant.buildReply(updatedSession, command.content);

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
      llmEnabled: this.llmOrchestrator?.isEnabled() === true,
    });

    return toChatSessionResult(reloaded);
  }

  private async buildLLMReplyWithFallback(
    session: Parameters<ChatbotSalesAssistantService['buildReply']>[0],
  ) {
    try {
      const lastUserMessage = [...session.messages].reverse().find((message) => message.role === 'USER');
      return await this.llmOrchestrator!.buildReply(session, lastUserMessage?.content ?? '');
    } catch (error) {
      this.logger.warn('Chatbot LLM failed', {
        sessionId: session.id,
        fallbackUsed: 'safe_out_of_scope',
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        content:
          'Mình chỉ là trợ lý AI của AURA, hiện mình chỉ hỗ trợ tư vấn thời trang và sản phẩm trong shop. Bạn vui lòng không hỏi nội dung ngoài phạm vi này nhé.',
        status: session.status,
        shopperProfile: session.shopperProfile ?? {},
        leadPhone: session.leadPhone,
        leadEmail: session.leadEmail,
        lastIntent: 'out_of_scope',
        lastSummary: 'llm_safe_fallback',
        suggestedProducts: [],
        quickReplies: [
          { label: 'Đồ đi làm', value: 'Mình cần outfit đi làm' },
          { label: 'Đồ đi chơi', value: 'Gợi ý outfit đi chơi cuối tuần' },
          { label: 'Ngân sách 500k', value: 'Ngân sách của mình khoảng 500k' },
          { label: 'Để lại SĐT', value: 'Số điện thoại của mình là 0901234567' },
        ],
      };
    }
  }
}
