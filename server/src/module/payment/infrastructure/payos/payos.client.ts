import { PayOS } from '@payos/node';
import { getPayosConfig } from './payos.config';

let payosClient: PayOS | null = null;

export function getPayosClient(): PayOS {
  if (payosClient) {
    return payosClient;
  }

  const config = getPayosConfig();
  payosClient = new PayOS({
    clientId: config.clientId,
    apiKey: config.apiKey,
    checksumKey: config.checksumKey,
    logLevel: 'warn',
  });

  return payosClient;
}
