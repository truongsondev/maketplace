import app from './app';
import dotenv from 'dotenv';
import { createLogger } from './shared/util/logger';

const logger = createLogger('Server');

const env = process.env.NODE_ENV || 'development';
dotenv.config({
  path: `.env.${env}`,
});
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`, {
    environment: env,
    port: PORT,
  });
});
