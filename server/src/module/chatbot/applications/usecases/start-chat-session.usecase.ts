import { createLogger } from '@/shared/util/logger';
import { StartChatSessionCommand } from '../dto/command/start-chat-session.command';
import { ChatSessionResult } from '../dto/result/chat-session.result';
import { IStartChatSessionUseCase } from '../ports/input/start-chat-session.usecase';
import { IChatSessionRepository } from '../ports/output/chat-session.repository';
import { toChatSessionResult } from './chat-session-result.mapper';

export class StartChatSessionUseCase implements IStartChatSessionUseCase {
  private readonly logger = createLogger('StartChatSessionUseCase');

  constructor(private readonly sessionRepository: IChatSessionRepository) {}

  async execute(command: StartChatSessionCommand): Promise<ChatSessionResult> {
    const session = await this.sessionRepository.create({
      guestToken: command.guestToken,
    });

    await this.sessionRepository.appendMessage(
      session.id,
      'ASSISTANT',
      'Chào bạn, mình là trợ lý bán hàng của AURA. Bạn đang tìm đồ đi làm, đi chơi hay cần lọc theo ngân sách/màu/size?',
      {
        quickReplies: [
          { label: 'Đồ đi làm', value: 'Mình cần outfit đi làm' },
          { label: 'Đồ đi chơi', value: 'Gợi ý outfit đi chơi cuối tuần' },
          { label: 'Ngân sách 500k', value: 'Ngân sách của mình khoảng 500k' },
        ],
      },
    );

    const reloaded = await this.sessionRepository.findById(session.id);
    if (!reloaded) {
      throw new Error('Chat session was created but could not be reloaded');
    }

    this.logger.info('Chat session started', { sessionId: reloaded.id });
    return toChatSessionResult(reloaded);
  }
}
