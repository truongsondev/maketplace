import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { createLogger } from '../../../../shared/util/logger';
import { RecommendationController } from '../../interface-adapter/controller/recommendation.controller';
import { RecommendationEventPayload } from '../../entities/recommendation.types';
import { recommendationEventBus } from '../messaging/recommendation-event-bus';

const logger = createLogger('RecommendationAPI');

function ensureSessionId(req: Request): string {
  const sessionId =
    req.header('x-session-id') ||
    (typeof req.query.sessionId === 'string' ? req.query.sessionId : null) ||
    (typeof req.body?.sessionId === 'string' ? req.body.sessionId : null);

  if (!sessionId || sessionId.trim().length < 4) {
    throw new BadRequestError('sessionId is required via x-session-id header or request body');
  }

  return sessionId.trim();
}

function parseLimit(req: Request, defaultLimit = 12): number {
  const raw = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : defaultLimit;
  if (!Number.isInteger(raw) || raw <= 0 || raw > 30) {
    throw new BadRequestError('limit must be an integer between 1 and 30');
  }
  return raw;
}

export class RecommendationAPI {
  readonly router = express.Router();

  constructor(private readonly recommendationController: RecommendationController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/track', asyncHandler(this.track.bind(this)));
    this.router.get('/recommendations/home', asyncHandler(this.getHome.bind(this)));
    this.router.get('/recommendations/product/:id', asyncHandler(this.getProduct.bind(this)));
    this.router.get('/recommendations/cart', asyncHandler(this.getCart.bind(this)));
    this.router.get('/recommendations/personalized', asyncHandler(this.getPersonalized.bind(this)));
    this.router.get('/analytics/recommendations', asyncHandler(this.getAnalytics.bind(this)));
  }

  private async track(req: Request, res: Response): Promise<void> {
    const sessionId = ensureSessionId(req);
    const eventType = req.body?.eventType;

    const validTypes = new Set([
      'VIEW_PRODUCT',
      'ADD_TO_CART',
      'REMOVE_FROM_CART',
      'PURCHASE',
      'SEARCH_QUERY',
      'FAVORITE_PRODUCT',
    ]);

    if (!validTypes.has(eventType)) {
      throw new BadRequestError('eventType is invalid');
    }

    const dedupeKey =
      req.body?.dedupeKey ||
      req.header('x-idempotency-key') ||
      `${eventType}:${req.userId ?? 'guest'}:${sessionId}:${req.body?.productId ?? req.body?.searchQuery ?? 'na'}:${req.body?.occurredAt ?? new Date().toISOString()}`;

    const payload: RecommendationEventPayload = {
      eventType,
      userId: req.userId ?? null,
      sessionId,
      productId: typeof req.body?.productId === 'string' ? req.body.productId : null,
      orderId: typeof req.body?.orderId === 'string' ? req.body.orderId : null,
      searchQuery: typeof req.body?.searchQuery === 'string' ? req.body.searchQuery : null,
      source: typeof req.body?.source === 'string' ? req.body.source : 'web',
      placement: typeof req.body?.placement === 'string' ? req.body.placement : null,
      metadata: typeof req.body?.metadata === 'object' ? req.body.metadata : null,
      dedupeKey,
      occurredAt:
        typeof req.body?.occurredAt === 'string'
          ? req.body.occurredAt
          : new Date().toISOString(),
    };

    try {
      await recommendationEventBus.publish(payload);
      logger.info('Recommendation event published to RabbitMQ', {
        eventType: payload.eventType,
        dedupeKey: payload.dedupeKey,
      });
    } catch (error) {
      logger.warn('Failed to publish recommendation event, falling back to direct ingest', {
        error,
      });
      await this.recommendationController.track(payload);
    }
    res
      .status(202)
      .json(ResponseFormatter.success({ accepted: true }, 'Tracking event accepted'));
  }

  private async getHome(req: Request, res: Response): Promise<void> {
    const sessionId = ensureSessionId(req);
    const limit = parseLimit(req);
    const result = await this.recommendationController.getHome(sessionId, limit);
    res.status(200).json(ResponseFormatter.success(result, 'Home recommendations retrieved'));
  }

  private async getProduct(req: Request, res: Response): Promise<void> {
    const sessionId = ensureSessionId(req);
    const limit = parseLimit(req, 8);
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.recommendationController.getProduct(productId, sessionId, limit);
    res.status(200).json(ResponseFormatter.success(result, 'Product recommendations retrieved'));
  }

  private async getCart(req: Request, res: Response): Promise<void> {
    if (!req.userId) {
      throw new BadRequestError('Authentication required');
    }

    const sessionId = ensureSessionId(req);
    const limit = parseLimit(req, 8);
    const result = await this.recommendationController.getCart(req.userId, sessionId, limit);
    res.status(200).json(ResponseFormatter.success(result, 'Cart recommendations retrieved'));
  }

  private async getPersonalized(req: Request, res: Response): Promise<void> {
    if (!req.userId) {
      throw new BadRequestError('Authentication required');
    }

    const sessionId = ensureSessionId(req);
    const limit = parseLimit(req, 12);
    const result = await this.recommendationController.getPersonalized(
      req.userId,
      sessionId,
      limit,
    );
    res.status(200).json(ResponseFormatter.success(result, 'Personalized recommendations retrieved'));
  }

  private async getAnalytics(req: Request, res: Response): Promise<void> {
    const fromDate = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
    const toDate = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;
    const result = await this.recommendationController.getAnalytics(fromDate, toDate);
    res.status(200).json(ResponseFormatter.success(result, 'Recommendation analytics retrieved'));
  }
}

export function logRecommendationBootstrapWarning(error: unknown): void {
  logger.warn('Recommendation bootstrap warning', { error });
}
