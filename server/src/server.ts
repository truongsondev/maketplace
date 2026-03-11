import app from './app';
import dotenv from 'dotenv';
import { createLogger } from './shared/util/logger';

const logger = createLogger('Server');

const env = process.env.NODE_ENV || 'development';
dotenv.config({
  path: `.env.${env}`,
});
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0'; // Lắng nghe trên tất cả network interfaces

app.listen(Number(PORT), HOST, () => {
  logger.info(`Server listening on ${HOST}:${PORT}`, {
    environment: env,
    port: PORT,
    host: HOST,
  });
});
