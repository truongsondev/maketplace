import type { IGenerateBannerUploadSignatureUseCase } from '../ports/input/admin-banner.usecase';
import type { ICloudinaryService } from '../ports/output/cloudinary.service';

export class GenerateBannerUploadSignatureUseCase implements IGenerateBannerUploadSignatureUseCase {
  constructor(private readonly cloudinaryService: ICloudinaryService) {}

  execute(folder?: string): {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000);
    const normalizedFolder = folder?.trim() ? folder.trim() : 'banners';

    const paramsToSign = {
      timestamp,
      folder: normalizedFolder,
    };

    return {
      signature: this.cloudinaryService.generateSignature(paramsToSign),
      timestamp,
      cloudName: this.cloudinaryService.getCloudName(),
      apiKey: this.cloudinaryService.getApiKey(),
      folder: normalizedFolder,
    };
  }
}
