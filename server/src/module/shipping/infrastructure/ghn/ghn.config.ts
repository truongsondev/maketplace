export type GhnConfig = {
  enabled: boolean;
  environment: 'test' | 'production';
  baseUrl: string;
  token: string;
  shopId: number;
  clientId?: string;
  webhookSecret?: string;
  fromName: string;
  fromPhone: string;
  fromAddress: string;
  fromWardCode: string;
  fromDistrictId: number;
  returnPhone?: string;
  returnAddress?: string;
  returnWardCode?: string;
  returnDistrictId?: number;
  serviceTypeId: number;
  requiredNote: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  previewBeforeCreate: boolean;
  timeoutMs: number;
};

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getGhnConfig(): GhnConfig {
  const enabled = process.env.GHN_ENABLED === 'true';
  const environment = process.env.GHN_ENV === 'production' ? 'production' : 'test';
  const config: GhnConfig = {
    enabled,
    environment,
    baseUrl: (process.env.GHN_BASE_URL || (environment === 'production'
      ? 'https://online-gateway.ghn.vn/shiip/public-api'
      : 'https://dev-online-gateway.ghn.vn/shiip/public-api')).replace(/\/$/, ''),
    token: process.env.GHN_TOKEN?.trim() || '',
    shopId: positiveInt(process.env.GHN_SHOP_ID, 0),
    clientId: process.env.GHN_CLIENT_ID?.trim() || undefined,
    webhookSecret: process.env.GHN_WEBHOOK_SECRET?.trim() || undefined,
    fromName: process.env.GHN_FROM_NAME?.trim() || '',
    fromPhone: process.env.GHN_FROM_PHONE?.trim() || '',
    fromAddress: process.env.GHN_FROM_ADDRESS?.trim() || '',
    fromWardCode: process.env.GHN_FROM_WARD_CODE?.trim() || '',
    fromDistrictId: positiveInt(process.env.GHN_FROM_DISTRICT_ID, 0),
    returnPhone: process.env.GHN_RETURN_PHONE?.trim() || undefined,
    returnAddress: process.env.GHN_RETURN_ADDRESS?.trim() || undefined,
    returnWardCode: process.env.GHN_RETURN_WARD_CODE?.trim() || undefined,
    returnDistrictId: positiveInt(process.env.GHN_RETURN_DISTRICT_ID, 0) || undefined,
    serviceTypeId: positiveInt(process.env.GHN_DEFAULT_SERVICE_TYPE_ID, 2),
    requiredNote: process.env.GHN_DEFAULT_REQUIRED_NOTE?.trim() || 'KHONGCHOXEMHANG',
    weight: positiveInt(process.env.GHN_DEFAULT_WEIGHT_GRAM, 500),
    length: positiveInt(process.env.GHN_DEFAULT_LENGTH_CM, 20),
    width: positiveInt(process.env.GHN_DEFAULT_WIDTH_CM, 15),
    height: positiveInt(process.env.GHN_DEFAULT_HEIGHT_CM, 5),
    previewBeforeCreate: process.env.GHN_PREVIEW_BEFORE_CREATE === 'true',
    timeoutMs: positiveInt(process.env.GHN_HTTP_TIMEOUT_MS, 15000),
  };

  if (enabled) {
    const missing = [
      ['GHN_TOKEN', config.token], ['GHN_SHOP_ID', config.shopId],
      ['GHN_FROM_NAME', config.fromName], ['GHN_FROM_PHONE', config.fromPhone],
      ['GHN_FROM_ADDRESS', config.fromAddress], ['GHN_FROM_WARD_CODE', config.fromWardCode],
      ['GHN_FROM_DISTRICT_ID', config.fromDistrictId],
    ].filter(([, value]) => !value).map(([name]) => name);
    if (missing.length) throw new Error(`Missing GHN configuration: ${missing.join(', ')}`);
  }
  return config;
}
