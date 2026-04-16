import express from 'express';
import cors from 'cors';
import { createAuthModule } from './module/auth/di';
import { createProductModule } from './module/product/di';
import { createAdminModule } from './module/admin/products/di';
import { createAdminAuthModule } from './module/admin/auth/di';
import { createAdminOrdersModule } from './module/admin/orders/di';
import { createCommonModule } from './module/common/di';
import { createCartModule } from './module/cart/di';
import { createPaymentModule } from './module/payment/di';
import { createPublicVoucherModule, createVoucherModule } from './module/voucher/di';
import { createAddressModule } from './module/address/di';
import { createOrderModule } from './module/order/di';
import { createMockOrdersModule } from './module/mock-orders/di';
import { createReviewModule } from './module/review/di';
import { createAdminVoucherModule } from './module/admin/voucher/di';
import { createAdminBannerModule } from './module/admin/banner/di';
import { createAdminUsersModule } from './module/admin/users/di';
import { createAdminRefundModule } from './module/admin/refund/di';
import { createAdminDashboardModule } from './module/admin/dashboard/di';
import { createAdminLogsModule } from './module/admin/logs/di';
import { createPublicBannerModule } from './module/banner/di';
import { createPublicLocationModule } from './module/location/di';
import { errorHandlingMiddleware } from './shared/server/error-middleware';
import { createAuthMiddleware } from './infrastructure/middlewares/auth.middleware';
import { RedisSessionVerifier } from './infrastructure/middlewares/redis-session-verifier';
import { requestLoggingMiddleware } from './infrastructure/middlewares/logging.middleware';
import { requireAdmin } from './infrastructure/middlewares/role.middleware';
import { redis } from './infrastructure/database';
import { createLogger } from './shared/util/logger';

const logger = createLogger('App');
const app = express();

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://160.187.229.142:3000',
  'http://160.187.229.142:5173',
];

const corsOriginAllowlist = new Set([
  ...defaultCorsOrigins,
  ...parseCorsOrigins(process.env.CORS_ORIGINS),
]);

// CORS configuration - cho phép truy cập từ frontend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOriginAllowlist.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// Thêm headers cho Private Network Access
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use(requestLoggingMiddleware);

app.use('/api/common', createCommonModule());
app.use('/api/common/vouchers', createPublicVoucherModule());
app.use('/api/common/banners', createPublicBannerModule());
app.use('/api/common/locations', createPublicLocationModule());

// NOTE: mock/manual endpoints for Postman testing (no auth)
app.use('/api/mock/orders', createMockOrdersModule());

app.use('/api/auth', createAuthModule());
app.use('/api/admin/auth', createAdminAuthModule());

app.use(createAuthMiddleware(new RedisSessionVerifier(redis)));
app.use('/api/addresses', createAddressModule());
app.use('/api/cart', createCartModule());
app.use('/api/orders', createOrderModule());
app.use('/api/reviews', createReviewModule());
app.use('/api/products', createProductModule());
app.use('/api/payments', createPaymentModule());
app.use('/api/vouchers', createVoucherModule());

app.use('/api/admin', requireAdmin, createAdminModule());
app.use('/api/admin/orders', requireAdmin, createAdminOrdersModule());
app.use('/api/admin/dashboard', requireAdmin, createAdminDashboardModule());
app.use('/api/admin/logs', requireAdmin, createAdminLogsModule());
app.use('/api/admin/vouchers', requireAdmin, createAdminVoucherModule());
app.use('/api/admin/banners', requireAdmin, createAdminBannerModule());
app.use('/api/admin/users', requireAdmin, createAdminUsersModule());
app.use('/api/admin/refunds', requireAdmin, createAdminRefundModule());

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.use(errorHandlingMiddleware);

logger.info('Express app configured successfully');

export default app;
