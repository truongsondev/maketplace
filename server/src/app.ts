import express from 'express';
import cors from 'cors';
import { createAuthModule } from './module/auth/di';
import { createProductModule } from './module/product/di';
import { createAdminModule } from './module/admin/di';
import { errorHandlingMiddleware } from './shared/server/error-middleware';
import { createAuthMiddleware } from './infrastructure/middlewares/auth.middleware';
import { RedisSessionVerifier } from './infrastructure/middlewares/redis-session-verifier';
import { requestLoggingMiddleware } from './infrastructure/middlewares/logging.middleware';
import { requireAdmin } from './infrastructure/middlewares/role.middleware';
import { redis } from './infrastructure/database';
import { createLogger } from './shared/util/logger';

const logger = createLogger('App');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLoggingMiddleware);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Public routes (không cần authentication)
app.use('/api/auth', createAuthModule());

// Protected routes (cần authentication)
app.use(createAuthMiddleware(new RedisSessionVerifier(redis)));
app.use('/api/products', createProductModule());

// Admin routes (cần authentication + ADMIN role)
app.use('/api/admin', requireAdmin, createAdminModule());

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.use(errorHandlingMiddleware);

logger.info('Express app configured successfully');

export default app;
