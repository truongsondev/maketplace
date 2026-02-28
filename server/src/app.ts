import express from 'express';
import cors from 'cors';
import { createAuthModule } from './module/auth/di';
import { errorHandlingMiddleware } from './shared/server/error-middleware';
import { createAuthMiddleware } from './infrastructure/middlewares/auth.middleware';
import { RedisSessionVerifier } from './infrastructure/middlewares/redis-session-verifier';
import { redis } from './infrastructure/database';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(createAuthMiddleware(new RedisSessionVerifier(redis)));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', createAuthModule());

app.use(errorHandlingMiddleware);

export default app;
