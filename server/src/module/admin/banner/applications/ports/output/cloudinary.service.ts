export interface ICloudinaryService {
  generateSignature(params: Record<string, string | number>): string;
  getCloudName(): string;
  getApiKey(): string;
}
