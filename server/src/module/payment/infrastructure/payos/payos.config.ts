import { BadRequestError } from '../../../../error-handlling/badRequestError';

export interface PayosConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  returnUrl: string;
  cancelUrl: string;
}

function readEnv(primary: string, fallback?: string): string | undefined {
  const primaryValue = process.env[primary]?.trim();
  if (primaryValue) return primaryValue;

  if (!fallback) return undefined;
  const fallbackValue = process.env[fallback]?.trim();
  return fallbackValue || undefined;
}

function getRequiredEnv(primary: string, fallback?: string): string {
  const value = readEnv(primary, fallback);
  if (!value) {
    const keyMessage = fallback ? `${primary} or ${fallback}` : primary;
    throw new BadRequestError(`Missing environment variable: ${keyMessage}`);
  }
  return value;
}

export function getPayosConfig(): PayosConfig {
  return {
    clientId: getRequiredEnv('CLIENT_ID', 'PAYOS_CLIENT_ID'),
    apiKey: getRequiredEnv('API_KEY', 'PAYOS_API_KEY'),
    checksumKey: getRequiredEnv('CHECKSUM_KEY', 'PAYOS_CHECKSUM_KEY'),
    returnUrl: getRequiredEnv('PAYOS_RETURN_URL'),
    cancelUrl: getRequiredEnv('PAYOS_CANCEL_URL'),
  };
}
