import express, { Request, Response } from 'express';
import { BadRequestError } from '@/error-handlling/badRequestError';
import { ResponseFormatter } from '@/shared/server/api-response';
import { asyncHandler } from '@/shared/server/error-middleware';
import { ChatbotController } from '../../interface-adapter/controller/chatbot.controller';

export class ChatbotAPI {
  readonly router = express.Router();

  constructor(private readonly chatbotController: ChatbotController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/sessions', asyncHandler(this.startSession.bind(this)));
    this.router.get('/sessions/:sessionId', asyncHandler(this.getSession.bind(this)));
    this.router.post('/sessions/:sessionId/messages', asyncHandler(this.sendMessage.bind(this)));
  }

  private getGuestToken(req: Request): string | null {
    const headerValue = req.header('x-chatbot-guest-token');
    if (typeof headerValue === 'string' && headerValue.trim()) {
      return headerValue.trim();
    }

    const queryValue = req.query.guestToken;
    if (typeof queryValue === 'string' && queryValue.trim()) {
      return queryValue.trim();
    }

    const bodyValue = req.body?.guestToken;
    if (typeof bodyValue === 'string' && bodyValue.trim()) {
      return bodyValue.trim();
    }

    return null;
  }

  private async startSession(req: Request, res: Response): Promise<void> {
    const guestToken = this.getGuestToken(req) ?? undefined;
    const result = await this.chatbotController.startSession({
      userId: req.userId ?? null,
      guestToken,
    });
    res.status(201).json(ResponseFormatter.success(result, 'Chat session created'));
  }

  private async getSession(req: Request, res: Response): Promise<void> {
    const sessionId = String(req.params.sessionId || '').trim();
    if (!sessionId) {
      throw new BadRequestError('sessionId is required');
    }

    const result = await this.chatbotController.getSession(sessionId, {
      userId: req.userId ?? null,
      guestToken: this.getGuestToken(req),
    });
    res.status(200).json(ResponseFormatter.success(result));
  }

  private async sendMessage(req: Request, res: Response): Promise<void> {
    const sessionId = String(req.params.sessionId || '').trim();
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

    if (!sessionId) {
      throw new BadRequestError('sessionId is required');
    }
    if (!content) {
      throw new BadRequestError('content is required');
    }
    if (content.length > 1500) {
      throw new BadRequestError('content is too long');
    }

    const result = await this.chatbotController.sendMessage({
      sessionId,
      content,
      userId: req.userId ?? null,
      guestToken: this.getGuestToken(req),
    });
    res.status(200).json(ResponseFormatter.success(result));
  }
}
