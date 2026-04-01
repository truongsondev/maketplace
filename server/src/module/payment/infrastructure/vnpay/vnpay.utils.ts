import crypto from 'crypto';

export type VnpParams = Record<string, string | undefined>;

function strictEncode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

export function filterAndSortVnpParams(input: VnpParams): Record<string, string> {
  const entries = Object.entries(input)
    .filter(([key, value]) => {
      if (!key.startsWith('vnp_')) return false;
      if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') return false;
      return value !== undefined && value !== null && value !== '';
    })
    .map(([key, value]) => [key, value as string] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(entries);
}

export function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${strictEncode(key)}=${strictEncode(value)}`)
    .join('&');
}

export function signVnpParams(params: VnpParams, hashSecret: string): string {
  const filtered = filterAndSortVnpParams(params);
  const dataToSign = buildQueryString(filtered);
  return crypto.createHmac('sha512', hashSecret).update(dataToSign, 'utf-8').digest('hex');
}

export function verifyVnpSignature(params: VnpParams, hashSecret: string): boolean {
  const incomingSignature = params.vnp_SecureHash;
  if (!incomingSignature) {
    return false;
  }

  const expectedSignature = signVnpParams(params, hashSecret);
  return expectedSignature.toLowerCase() === incomingSignature.toLowerCase();
}

export function buildSignedPaymentUrl(
  baseUrl: string,
  params: VnpParams,
  hashSecret: string,
): string {
  const sorted = filterAndSortVnpParams(params);
  const secureHash = signVnpParams(sorted, hashSecret);
  const finalQuery = buildQueryString({
    ...sorted,
    vnp_SecureHash: secureHash,
  });

  return `${baseUrl}?${finalQuery}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatVnpDate(date: Date): string {
  // VNPAY expects Vietnam time (UTC+7) in yyyyMMddHHmmss format.
  const vietnamOffsetMs = 7 * 60 * 60 * 1000;
  const vnDate = new Date(date.getTime() + vietnamOffsetMs);

  const year = vnDate.getUTCFullYear();
  const month = pad2(vnDate.getUTCMonth() + 1);
  const day = pad2(vnDate.getUTCDate());
  const hours = pad2(vnDate.getUTCHours());
  const minutes = pad2(vnDate.getUTCMinutes());
  const seconds = pad2(vnDate.getUTCSeconds());

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function parseVnpAmountToVnd(rawAmount: string | undefined): number | null {
  if (!rawAmount) return null;
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount)) return null;
  return amount / 100;
}
