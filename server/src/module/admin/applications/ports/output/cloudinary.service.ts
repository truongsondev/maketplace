export interface ICloudinaryService {
  generateSignature(params: Record<string, any>): string;
  deleteImage(publicId: string): Promise<{ result: string }>;
  getCloudName(): string;
  getApiKey(): string;
}
