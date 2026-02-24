import express from 'express';
import cors from 'cors';
import { createAuthModule } from './module/auth/di';
import { errorHandlingMiddleware } from './shared/server/error-middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', createAuthModule());

app.use(errorHandlingMiddleware);

export default app;
