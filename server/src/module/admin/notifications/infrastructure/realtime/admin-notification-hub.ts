import type { Response } from 'express';

interface HubClient {
  id: string;
  userId: string;
  res: Response;
}

export interface NotificationRealtimePayload {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

class AdminNotificationHub {
  private readonly clients = new Map<string, HubClient>();

  addClient(userId: string, res: Response): string {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.clients.set(id, { id, userId, res });
    return id;
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  sendKeepAlive(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    client.res.write(': keepalive\n\n');
  }

  sendPaymentSuccess(userId: string, payload: NotificationRealtimePayload): void {
    for (const client of this.clients.values()) {
      if (client.userId !== userId) continue;
      client.res.write('event: payment_success\n');
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  sendLowStock(userId: string, payload: NotificationRealtimePayload): void {
    for (const client of this.clients.values()) {
      if (client.userId !== userId) continue;
      client.res.write('event: low_stock\n');
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  sendCancelRequest(userId: string, payload: NotificationRealtimePayload): void {
    for (const client of this.clients.values()) {
      if (client.userId !== userId) continue;
      client.res.write('event: cancel_request\n');
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }
}

export const adminNotificationHub = new AdminNotificationHub();
