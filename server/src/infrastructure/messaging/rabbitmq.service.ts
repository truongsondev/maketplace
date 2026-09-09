import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { createLogger } from '../../shared/util/logger';

const logger = createLogger('RabbitMQService');

export interface OrderPaymentSuccessEvent {
  orderId: string;
  orderCode: string;
  amount: number;
  paidAt: string;
}

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const PAYMENT_EVENTS_EXCHANGE = process.env.RABBITMQ_PAYMENT_EXCHANGE || 'shop_events';
const PAYMENT_SUCCESS_ROUTING_KEY =
  process.env.RABBITMQ_PAYMENT_SUCCESS_ROUTING_KEY || 'order.payment.success';
const PAYMENT_SUCCESS_QUEUE =
  process.env.RABBITMQ_ADMIN_NOTIFICATION_QUEUE || 'admin_notification_q';
const PAYMENT_SUCCESS_DLX = process.env.RABBITMQ_ADMIN_NOTIFICATION_DLX || 'admin_notification_dlx';
const PAYMENT_SUCCESS_DLQ = process.env.RABBITMQ_ADMIN_NOTIFICATION_DLQ || 'admin_notification_dlq';

class RabbitMQService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private consumeStarted = false;

  private async getChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    const connection = await amqp.connect(RABBITMQ_URL);
    this.connection = connection;

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      this.connection = null;
      this.channel = null;
      this.consumeStarted = false;
    });

    connection.on('error', (error) => {
      logger.error('RabbitMQ connection error', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    const channel = await connection.createChannel();
    this.channel = channel;
    await channel.prefetch(10);
    await this.setupTopology(channel);

    logger.info('RabbitMQ channel initialized', {
      exchange: PAYMENT_EVENTS_EXCHANGE,
      queue: PAYMENT_SUCCESS_QUEUE,
      dlq: PAYMENT_SUCCESS_DLQ,
    });

    return channel;
  }

  private async setupTopology(channel: Channel): Promise<void> {
    await channel.assertExchange(PAYMENT_EVENTS_EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(PAYMENT_SUCCESS_DLX, 'topic', { durable: true });

    await channel.assertQueue(PAYMENT_SUCCESS_DLQ, { durable: true });
    await channel.bindQueue(PAYMENT_SUCCESS_DLQ, PAYMENT_SUCCESS_DLX, PAYMENT_SUCCESS_ROUTING_KEY);

    await channel.assertQueue(PAYMENT_SUCCESS_QUEUE, {
      durable: true,
      deadLetterExchange: PAYMENT_SUCCESS_DLX,
      deadLetterRoutingKey: PAYMENT_SUCCESS_ROUTING_KEY,
    });
    await channel.bindQueue(
      PAYMENT_SUCCESS_QUEUE,
      PAYMENT_EVENTS_EXCHANGE,
      PAYMENT_SUCCESS_ROUTING_KEY,
    );
  }

  async publishPaymentSuccess(event: OrderPaymentSuccessEvent): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(JSON.stringify(event));

    const ok = channel.publish(PAYMENT_EVENTS_EXCHANGE, PAYMENT_SUCCESS_ROUTING_KEY, payload, {
      contentType: 'application/json',
      deliveryMode: 2,
      timestamp: Date.now(),
    });

    if (!ok) {
      logger.warn('RabbitMQ publish buffer full, message queued in memory');
    }
  }

  async consumePaymentSuccess(
    handler: (event: OrderPaymentSuccessEvent) => Promise<void>,
  ): Promise<void> {
    if (this.consumeStarted) {
      return;
    }

    const channel = await this.getChannel();
    this.consumeStarted = true;

    await channel.consume(PAYMENT_SUCCESS_QUEUE, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString()) as OrderPaymentSuccessEvent;
        await handler(payload);
        channel.ack(msg);
      } catch (error) {
        logger.error('RabbitMQ consumer failed to process message', {
          error: error instanceof Error ? error.message : String(error),
        });
        channel.nack(msg, false, false);
      }
    });

    logger.info('RabbitMQ consumer started', {
      queue: PAYMENT_SUCCESS_QUEUE,
    });
  }
}

export const rabbitMQService = new RabbitMQService();
