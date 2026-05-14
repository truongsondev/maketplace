import { createHash } from 'node:crypto';
import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { createLogger } from '../../../../shared/util/logger';
import { RecommendationController } from '../../interface-adapter/controller/recommendation.controller';
import { RecommendationEventPayload } from '../../entities/recommendation.types';
import { recommendationEventBus } from '../messaging/recommendation-event-bus';

const logger = createLogger('RecommendationAPI');
const MAX_DEDUPE_KEY_LENGTH = 120;

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function buildDedupeKey(source: string): string {
  const normalized = source.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_DEDUPE_KEY_LENGTH) {
    return normalized;
  }

  return `trk:${createHash('sha256').update(normalized).digest('hex')}`;
}

function createTrackingDedupeKey(params: {
  provided: unknown;
  eventType: string;
  userId: string | null;
  sessionId: string;
  productId: string | null;
  orderId: string | null;
  searchQuery: string | null;
  occurredAt: string;
}): string {
  const provided = cleanString(params.provided);
  if (provided) {
    return buildDedupeKey(provided);
  }

  const target =
    params.productId ?? params.orderId ?? (params.searchQuery ? `q:${params.searchQuery}` : 'na');

  return buildDedupeKey(
    [params.eventType, params.userId ?? 'guest', params.sessionId, target, params.occurredAt].join(
      ':',
    ),
  );
}

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
  const raw =
    typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : defaultLimit;
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

    const occurredAt = cleanString(req.body?.occurredAt) ?? new Date().toISOString();
    const productId = cleanString(req.body?.productId);
    const orderId = cleanString(req.body?.orderId);
    const searchQuery = cleanString(req.body?.searchQuery);
    const dedupeKey = createTrackingDedupeKey({
      provided: req.body?.dedupeKey ?? req.header('x-idempotency-key'),
      eventType,
      userId: req.userId ?? null,
      sessionId,
      productId,
      orderId,
      searchQuery,
      occurredAt,
    });

    const payload: RecommendationEventPayload = {
      eventType,
      userId: req.userId ?? null,
      sessionId,
      productId,
      orderId,
      searchQuery,
      source: typeof req.body?.source === 'string' ? req.body.source : 'web',
      placement: typeof req.body?.placement === 'string' ? req.body.placement : null,
      metadata: typeof req.body?.metadata === 'object' ? req.body.metadata : null,
      dedupeKey,
      occurredAt,
    };

    const result = await this.recommendationController.track(payload);

    try {
      await recommendationEventBus.publish(payload);
      logger.info('Recommendation event published to RabbitMQ', {
        eventType: payload.eventType,
        dedupeKey: payload.dedupeKey,
      });
    } catch (error) {
      logger.warn('Failed to publish recommendation event after direct ingest', {
        error,
      });
    }
    res.status(202).json(ResponseFormatter.success(result, 'Tracking event accepted'));
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
    res
      .status(200)
      .json(ResponseFormatter.success(result, 'Personalized recommendations retrieved'));
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
