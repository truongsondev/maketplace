import express from 'express';
import request from 'supertest';
import { describe, expect, it, jest } from '@jest/globals';
import { RecommendationController } from '../../../interface-adapter/controller/recommendation.controller';

jest.unstable_mockModule('../../messaging/recommendation-event-bus', () => ({
  recommendationEventBus: {
    publish: jest.fn(async () => undefined),
  },
}));

const { RecommendationAPI } = await import('../recommendation.api');

function makeApp(controller: Partial<RecommendationController>) {
  const app = express();
  app.use(express.json());
  app.use('/api', new RecommendationAPI(controller as RecommendationController).router);
  return app;
}

describe('RecommendationAPI tracking validation', () => {
  it('accepts recommendation click tracking with a product id', async () => {
    const track = jest.fn<RecommendationController['track']>().mockResolvedValue({
      accepted: true,
      duplicated: false,
    });
    const app = makeApp({ track });

    const response = await request(app)
      .post('/api/track')
      .set('x-session-id', 'session-1')
      .send({
        eventType: 'RECOMMENDATION_CLICK',
        productId: 'product-1',
        placement: 'home_recommendations',
        metadata: {
          strategy: 'hot_products+top_viewed',
          reason: 'Sản phẩm đang được quan tâm nhiều',
          score: 12,
        },
      });

    expect(response.status).toBe(202);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'RECOMMENDATION_CLICK',
        productId: 'product-1',
      }),
    );
  });

  it('rejects recommendation clicks without product id', async () => {
    const track = jest.fn<RecommendationController['track']>();
    const app = makeApp({ track });

    const response = await request(app).post('/api/track').set('x-session-id', 'session-1').send({
      eventType: 'RECOMMENDATION_CLICK',
    });

    expect(response.status).toBe(400);
    expect(track).not.toHaveBeenCalled();
  });

  it('requires recommendation ids for recommendation impressions', async () => {
    const track = jest.fn<RecommendationController['track']>();
    const app = makeApp({ track });

    const response = await request(app).post('/api/track').set('x-session-id', 'session-1').send({
      eventType: 'RECOMMENDATION_IMPRESSION',
      metadata: {},
    });

    expect(response.status).toBe(400);
    expect(track).not.toHaveBeenCalled();
  });
});
