import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Determine the log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  // Development: show all logs including debug
  // Production: show http and above (http, info, warn, error)
  return isDevelopment ? 'debug' : 'http';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Define format for console output (colorized)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// Define transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports only in production or when explicitly configured
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  const logsDir = path.join(process.cwd(), 'logs');

  // All logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format,
    }),
  );

  // Error logs
  transports.push(
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format,
    }),
  );

  // HTTP logs
  transports.push(
    new DailyRotateFile({
      level: 'http',
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      format,
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a logger factory for module-specific loggers
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(message: string, meta?: any): any {
    const formattedMessage = `[${this.context}] ${message}`;
    if (meta) {
      return { message: formattedMessage, ...meta };
    }
    return formattedMessage;
  }

  error(message: string, error?: Error | any, meta?: any): void {
    if (error instanceof Error) {
      logger.error(
        this.formatMessage(message, {
          ...meta,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        }),
      );
    } else if (error) {
      logger.error(this.formatMessage(message, { ...meta, error }));
    } else {
      logger.error(this.formatMessage(message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    logger.warn(this.formatMessage(message, meta));
  }

  info(message: string, meta?: any): void {
    logger.info(this.formatMessage(message, meta));
  }

  http(message: string, meta?: any): void {
    logger.http(this.formatMessage(message, meta));
  }

  debug(message: string, meta?: any): void {
    logger.debug(this.formatMessage(message, meta));
  }
}

// Export the base logger and factory
export default logger;
export const createLogger = (context: string) => new Logger(context);
