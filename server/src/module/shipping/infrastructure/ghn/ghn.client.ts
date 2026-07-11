import type { GhnConfig } from './ghn.config';

type GhnEnvelope<T> = { code: number; message?: string; data: T };

export class GhnApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: unknown) {
    super(message);
  }
}

export class GhnClient {
  constructor(private readonly config: GhnConfig) {}

  private async request<T>(path: string, init: RequestInit, shopHeader = true): Promise<T> {
    if (!this.config.enabled) throw new GhnApiError('GHN integration is disabled', 503);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Token: this.config.token,
          ...(shopHeader ? { ShopId: String(this.config.shopId) } : {}),
          ...init.headers,
        },
      });
      const body = await response.json().catch(() => null) as GhnEnvelope<T> | null;
      if (!response.ok || !body || body.code !== 200) {
        throw new GhnApiError(body?.message || `GHN request failed (${response.status})`, response.status, body);
      }
      return body.data;
    } catch (error) {
      if (error instanceof GhnApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new GhnApiError('GHN request timed out', 504);
      throw new GhnApiError(error instanceof Error ? error.message : 'Cannot connect to GHN', 502);
    } finally {
      clearTimeout(timer);
    }
  }

  provinces() { return this.request<unknown[]>('/master-data/province', { method: 'GET' }, false); }
  districts(provinceId: number) { return this.request<unknown[]>(`/master-data/district?province_id=${provinceId}`, { method: 'GET' }, false); }
  wards(districtId: number) { return this.request<unknown[]>('/master-data/ward', { method: 'POST', body: JSON.stringify({ district_id: districtId }) }, false); }
  preview(payload: unknown) { return this.request<Record<string, unknown>>('/v2/shipping-order/preview', { method: 'POST', body: JSON.stringify(payload) }); }
  create(payload: unknown) { return this.request<Record<string, unknown>>('/v2/shipping-order/create', { method: 'POST', body: JSON.stringify(payload) }); }
  detail(orderCode: string) { return this.request<Record<string, unknown>>('/v2/shipping-order/detail', { method: 'POST', body: JSON.stringify({ order_code: orderCode }) }); }
  detailByClientCode(clientOrderCode: string) { return this.request<Record<string, unknown>>('/v2/shipping-order/detail-by-client-code', { method: 'POST', body: JSON.stringify({ client_order_code: clientOrderCode }) }); }
  cancel(orderCode: string) { return this.request<unknown>('/v2/switch-status/cancel', { method: 'POST', body: JSON.stringify({ order_codes: [orderCode] }) }); }
  printToken(orderCode: string) { return this.request<{ token: string }>('/v2/a5/gen-token', { method: 'POST', body: JSON.stringify({ order_codes: [orderCode] }) }); }
}
