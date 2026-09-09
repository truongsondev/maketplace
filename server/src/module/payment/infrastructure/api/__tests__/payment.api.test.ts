import express from 'express';
import request from 'supertest';
import { describe, expect, it, jest } from '@jest/globals';
import { PaymentController } from '../../../interface-adapter/controller/payment.controller';
import { PaymentAPI } from '../payment.api';

function makeApp(controller: Partial<PaymentController>) {
  const app = express();
  app.use(express.json());
  app.use('/api/payments', new PaymentAPI(controller as PaymentController).router);
  return app;
}

describe('PaymentAPI COD policy', () => {
  it('rejects malformed COD requests with the disabled error before request validation', async () => {
    const createCodOrder = jest.fn<PaymentController['createCodOrder']>();
    const app = makeApp({ createCodOrder });

    const response = await request(app).post('/api/payments/cod/orders').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Thanh toán khi nhận hàng đang tạm ngừng',
        }),
      }),
    );
    expect(createCodOrder).not.toHaveBeenCalled();
  });
});
