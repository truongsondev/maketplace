import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { createLogger } from '../../shared/util/logger';
import { GetRecommendationAnalyticsUseCase } from './applications/usecases/get-recommendation-analytics.usecase';
import { GetRecommendationFeedUseCase } from './applications/usecases/get-recommendation-feed.usecase';
import { RefreshRecommendationArtifactsUseCase } from './applications/usecases/refresh-recommendation-artifacts.usecase';
import { TrackRecommendationEventUseCase } from './applications/usecases/track-recommendation-event.usecase';
import { RecommendationAPI } from './infrastructure/api/recommendation.api';
import { recommendationEventBus } from './infrastructure/messaging/recommendation-event-bus';
import { PrismaRecommendationRepository } from './infrastructure/repositories/prisma-recommendation.repository';
import { RecommendationController } from './interface-adapter/controller/recommendation.controller';

const logger = createLogger('RecommendationModule');
let consumersStarted = false;
let refreshIntervalStarted = false;

function bootstrapBackgroundWork(
  trackEventUseCase: TrackRecommendationEventUseCase,
  refreshUseCase: RefreshRecommendationArtifactsUseCase,
): void {
  if (!consumersStarted) {
    consumersStarted = true;
    recommendationEventBus
      .consume(async (event) => {
        await trackEventUseCase.execute(event);
      })
      .catch((error) => {
        logger.error('Failed to start recommendation event consumer', error);
        consumersStarted = false;
      });
  }

  if (!refreshIntervalStarted) {
    refreshIntervalStarted = true;

    refreshUseCase.execute().catch((error) => {
      logger.warn('Initial recommendation refresh failed', { error });
    });

    const intervalMs = Number(process.env.RECOMMENDATION_REFRESH_INTERVAL_MS || 15 * 60 * 1000);
    setInterval(() => {
      refreshUseCase.execute().catch((error) => {
        logger.warn('Scheduled recommendation refresh failed', { error });
      });
    }, intervalMs).unref();
  }
}

export function createRecommendationModule(): Router {
  const repository = new PrismaRecommendationRepository(prisma);
  const getRecommendationFeedUseCase = new GetRecommendationFeedUseCase(repository);
  const trackRecommendationEventUseCase = new TrackRecommendationEventUseCase(repository);
  const getRecommendationAnalyticsUseCase = new GetRecommendationAnalyticsUseCase(repository);
  const refreshRecommendationArtifactsUseCase = new RefreshRecommendationArtifactsUseCase(repository);

  bootstrapBackgroundWork(trackRecommendationEventUseCase, refreshRecommendationArtifactsUseCase);

  const controller = new RecommendationController(
    getRecommendationFeedUseCase,
    trackRecommendationEventUseCase,
    getRecommendationAnalyticsUseCase,
  );

  return new RecommendationAPI(controller).router;
}
