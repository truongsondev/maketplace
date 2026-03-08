import express from 'express';
import cors from 'cors';
import { createAuthModule } from './module/auth/di';
import { createProductModule } from './module/product/di';
import { createAdminModule } from './module/admin/di';
import { createCommonModule } from './module/common/di';
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use(requestLoggingMiddleware);

app.use('/api/common', createCommonModule());

app.use('/api/auth', createAuthModule());

app.use(createAuthMiddleware(new RedisSessionVerifier(redis)));
app.use('/api/products', createProductModule());

app.use('/api/admin', requireAdmin, createAdminModule());

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.use(errorHandlingMiddleware);

logger.info('Express app configured successfully');

export default app;
