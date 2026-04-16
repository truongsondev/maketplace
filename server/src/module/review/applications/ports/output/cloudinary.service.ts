export interface ICloudinaryService {
  generateSignature(params: Record<string, any>): string;
  getCloudName(): string;
  getApiKey(): string;
}
