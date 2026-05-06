import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { createLogger } from '../../../../shared/util/logger';
import { RecommendationEventPayload } from '../../entities/recommendation.types';

const logger = createLogger('RecommendationEventBus');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const EXCHANGE = process.env.RABBITMQ_RECOMMENDATION_EXCHANGE || 'recommendation.events';
const ROUTING_KEY = process.env.RABBITMQ_RECOMMENDATION_ROUTING_KEY || 'tracking.ingest';
const QUEUE = process.env.RABBITMQ_RECOMMENDATION_QUEUE || 'recommendation_tracking_q';
const RETRY_QUEUE = process.env.RABBITMQ_RECOMMENDATION_RETRY_QUEUE || 'recommendation_tracking_retry_q';
const DLX = process.env.RABBITMQ_RECOMMENDATION_DLX || 'recommendation.events.dlx';
const DLQ = process.env.RABBITMQ_RECOMMENDATION_DLQ || 'recommendation_tracking_dlq';
const RETRY_MS = Number(process.env.RABBITMQ_RECOMMENDATION_RETRY_MS || 15000);
const MAX_RETRIES = Number(process.env.RABBITMQ_RECOMMENDATION_MAX_RETRIES || 3);

export class RecommendationEventBus {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private consumerStarted = false;

  private async getChannel(): Promise<Channel> {
    if (this.channel) return this.channel;

    const connection = await amqp.connect(RABBITMQ_URL);
    this.connection = connection;

    connection.on('close', () => {
      this.connection = null;
      this.channel = null;
      this.consumerStarted = false;
      logger.warn('Recommendation RabbitMQ connection closed');
    });

    connection.on('error', (error) => {
      logger.error('Recommendation RabbitMQ connection error', error);
    });

    const channel = await connection.createChannel();
    await channel.prefetch(20);
    await this.setupTopology(channel);
    this.channel = channel;
    return channel;
  }

  private async setupTopology(channel: Channel): Promise<void> {
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(DLX, 'topic', { durable: true });
    await channel.assertQueue(DLQ, { durable: true });
    await channel.bindQueue(DLQ, DLX, ROUTING_KEY);

    await channel.assertQueue(RETRY_QUEUE, {
      durable: true,
      deadLetterExchange: EXCHANGE,
      deadLetterRoutingKey: ROUTING_KEY,
      messageTtl: RETRY_MS,
    });

    await channel.assertQueue(QUEUE, {
      durable: true,
      deadLetterExchange: DLX,
      deadLetterRoutingKey: ROUTING_KEY,
    });

    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  }

  async publish(event: RecommendationEventPayload): Promise<void> {
    const channel = await this.getChannel();
    channel.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(event)), {
      contentType: 'application/json',
      deliveryMode: 2,
      timestamp: Date.now(),
      headers: { 'x-retry-count': 0 },
    });
  }

  async consume(handler: (event: RecommendationEventPayload) => Promise<void>): Promise<void> {
    if (this.consumerStarted) return;

    const channel = await this.getChannel();
    this.consumerStarted = true;

    await channel.consume(QUEUE, async (message: ConsumeMessage | null) => {
      if (!message) return;

      try {
        const payload = JSON.parse(message.content.toString()) as RecommendationEventPayload;
        await handler(payload);
        channel.ack(message);
      } catch (error) {
        const retryCount = Number(message.properties.headers?.['x-retry-count'] ?? 0);

        if (retryCount < MAX_RETRIES) {
          channel.sendToQueue(RETRY_QUEUE, message.content, {
            contentType: 'application/json',
            deliveryMode: 2,
            headers: { 'x-retry-count': retryCount + 1 },
          });
          channel.ack(message);
        } else {
          logger.error('Recommendation event exceeded retry limit', error, {
            retryCount,
          });
          channel.nack(message, false, false);
        }
      }
    });
  }
}

export const recommendationEventBus = new RecommendationEventBus();

