import { Request } from 'express';

function firstForwardedIp(value: string): string {
  return value.split(',')[0]?.trim() || '';
}

export function parseClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.trim() !== '') {
    return firstForwardedIp(xForwardedFor);
  }

  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return firstForwardedIp(xForwardedFor[0]);
  }

  const xRealIp = req.headers['x-real-ip'];
  if (typeof xRealIp === 'string' && xRealIp.trim() !== '') {
    return xRealIp.trim();
  }

  if (req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return req.ip || '127.0.0.1';
}
